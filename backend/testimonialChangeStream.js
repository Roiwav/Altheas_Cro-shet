const Testimonial = require('./Testimonial.js');

const setupChangeStream = (io) => {
  // The 'feedbacks' collection is what we want to watch.
  const changeStream = Testimonial.watch();

  changeStream.on('change', (change) => {
    console.log('Database change detected:', change.operationType);

    switch (change.operationType) {
      case 'insert':
        // When a new document is inserted, emit an event with the new document.
        io.emit('testimonial_inserted', change.fullDocument);
        break;

      case 'delete':
        // When a document is deleted, emit an event with the ID of the deleted document.
        io.emit('testimonial_deleted', change.documentKey._id);
        break;

      case 'update':
      case 'replace':
        // For updates/replacements, you might want to refetch or send the updated doc.
        // For simplicity, we'll just notify clients that an update happened.
        io.emit('testimonial_updated', { _id: change.documentKey._id, ...change.updateDescription });
        break;
    }
  });

  console.log(' watching for changes in the feedbacks collection...');
};

module.exports = setupChangeStream;