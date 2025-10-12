// controllers/logController.js
const ActivityLog = require('../models/ActivityLog');

const getAllLogs = async (req, res) => {
  try {
    const { 
      eventType, 
      page = 1, 
      limit = 50, 
      search,
      startDate,
      endDate 
    } = req.query;

    let query = {};
    
    // Filter by event type
    if (eventType && Array.isArray(eventType)) {
      query.eventType = { $in: eventType };
    } else if (eventType) {
      query.eventType = eventType;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { actor: { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActivityLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};

const createLog = async (eventType, actor, resourceId, details, status = 'Success', metadata = {}) => {
  try {
    console.log('[LOG TEST] createLog:', { eventType, actor, resourceId, details, status, metadata });
    const log = new ActivityLog({
      eventType,
      actor,
      resourceId,
      details,
      status,
      metadata
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating activity log:', error);
  }
};

module.exports = {
  getAllLogs,
  createLog
};
