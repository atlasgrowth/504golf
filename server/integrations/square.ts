// Temporary stub – replace with real SDK later
export const catalogApi = null;

export const ordersApi = {
  async createOrder({ order }: any) {
    return {
      result: { 
        order: { 
          id: `MOCK_${Date.now()}`, 
          lineItems: order.lineItems 
        } 
      },
    };
  },
};

export const paymentsApi = null;
