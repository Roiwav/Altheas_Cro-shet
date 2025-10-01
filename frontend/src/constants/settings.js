export const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  registration: true,
  cod: true,
  gcashPayment: false,
  shippingZones: [
    {
      id: 'metro-manila',
      name: 'Metro Manila (NCR)',
      cities: ['Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Mandaluyong', 'San Juan', 'Pasay', 'Parañaque', 'Las Piñas', 'Muntinlupa', 'Marikina', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela', 'Pateros'],
      methods: [
        { id: 'standard', name: 'Standard Delivery', price: 50, description: '3-5 business days', isActive: true },
        { id: 'express', name: 'Express Delivery', price: 100, description: '1-2 business days', isActive: true },
        { id: 'pickup', name: 'Store Pickup (Alabang)', price: 0, description: 'Pickup at our Alabang branch', isActive: true }
      ],
      freeShippingThreshold: 1000,
      isActive: true
    },
    {
      id: 'laguna',
      name: 'Laguna Area',
      cities: ['Calamba', 'Santa Rosa', 'Cabuyao', 'Los Baños', 'San Pedro', 'Biñan', 'San Pablo', 'Calauan', 'Bay'],
      methods: [
        { id: 'standard', name: 'Standard Delivery', price: 70, description: '3-5 business days', isActive: true },
        { id: 'express', name: 'Express Delivery', price: 120, description: '2-3 business days', isActive: true },
        { id: 'pickup', name: 'Store Pickup (Calamba)', price: 0, description: 'Pickup at our Calamba branch', isActive: true }
      ],
      freeShippingThreshold: 1500,
      isActive: true
    },
    {
      id: 'cavite',
      name: 'Cavite Area',
      cities: ['Dasmariñas', 'Bacoor', 'Imus', 'General Trias', 'Trece Martires', 'Silang', 'Tagaytay', 'Kawit', 'General Mariano Alvarez'],
      methods: [
        { id: 'standard', name: 'Standard Delivery', price: 80, description: '3-5 business days', isActive: true },
        { id: 'express', name: 'Express Delivery', price: 150, description: '2-3 business days', isActive: true },
        { id: 'pickup', name: 'Store Pickup (Dasmariñas)', price: 0, description: 'Pickup at our Dasmariñas branch', isActive: true }
      ],
      freeShippingThreshold: 2000,
      isActive: true
    },
    {
      id: 'batangas',
      name: 'Batangas Area',
      cities: ['Batangas City', 'Lipa', 'Tanauan', 'Santo Tomas', 'Malvar', 'Laurel', 'Nasugbu', 'Balayan', 'Calaca'],
      methods: [
        { id: 'standard', name: 'Standard Delivery', price: 100, description: '3-7 business days', isActive: true },
        { id: 'express', name: 'Express Delivery', price: 180, description: '2-4 business days', isActive: true }
      ],
      freeShippingThreshold: 2500,
      isActive: true
    }
  ],
  storeLocations: [
    { id: 'alabang', name: 'Alabang Branch', address: '123 Commerce Ave, Alabang, Muntinlupa', contact: '09123456789', isMain: true },
    { id: 'calamba', name: 'Calamba Branch', address: '456 Rizal St, Calamba, Laguna', contact: '09123456788', isMain: false },
    { id: 'dasmariñas', name: 'Dasmariñas Branch', address: '789 Aguinaldo Hwy, Dasmariñas, Cavite', contact: '09123456787', isMain: false }
  ]
};
