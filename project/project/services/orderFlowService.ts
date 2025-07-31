import { orderService, Order } from './orderService';
import { driverService } from './driverService';
import { notificationService } from './notificationService';

export interface OrderFlowStep {
  status: Order['status'];
  title: string;
  description: string;
  estimatedTime?: string;
  actions?: string[];
}

class OrderFlowService {
  private orderSteps: OrderFlowStep[] = [
    {
      status: 'pending',
      title: 'Order Placed',
      description: 'Your order has been received and is being reviewed',
      estimatedTime: '5-15 minutes',
      actions: ['cancel']
    },
    {
      status: 'confirmed',
      title: 'Order Confirmed',
      description: 'Order confirmed and driver assignment in progress',
      estimatedTime: '30-60 minutes',
      actions: ['track', 'contact']
    },
    {
      status: 'in-progress',
      title: 'Items Picked Up',
      description: 'Your items have been collected and are being processed',
      estimatedTime: '24-48 hours',
      actions: ['track', 'contact']
    },
    {
      status: 'completed',
      title: 'Ready for Delivery',
      description: 'Your clean items are ready for delivery',
      estimatedTime: 'Delivery scheduled',
      actions: ['track', 'contact', 'rate']
    }
  ];

  async processOrderFlow(orderId: string, newStatus: Order['status']): Promise<void> {
    try {
      // Update order status
      await orderService.updateOrderStatus(orderId, newStatus);

      // Handle status-specific actions
      switch (newStatus) {
        case 'confirmed':
          await this.handleOrderConfirmation(orderId);
          break;
        case 'in-progress':
          await this.handleOrderPickup(orderId);
          break;
        case 'completed':
          await this.handleOrderCompletion(orderId);
          break;
      }
    } catch (error) {
      console.error('Error processing order flow:', error);
      throw error;
    }
  }

  private async handleOrderConfirmation(orderId: string): Promise<void> {
    try {
      // Send confirmation notification
      await notificationService.sendLocalNotification({
        orderId,
        type: 'order_assigned',
        title: '✅ Order Confirmed!',
        body: 'Your order has been confirmed. Driver assignment in progress.',
      });

      // Auto-assign driver if available
      const availableDrivers = await driverService.getAvailableDrivers();
      if (availableDrivers.length > 0) {
        // Simple assignment to first available driver
        const driver = availableDrivers[0];
        
        // Create mock pickup and delivery locations
        const pickupLocation = {
          latitude: -1.2921,
          longitude: 36.8219,
          address: 'Kleanly Pickup Center'
        };
        
        const deliveryLocation = {
          latitude: -1.2921 + (Math.random() - 0.5) * 0.1,
          longitude: 36.8219 + (Math.random() - 0.5) * 0.1,
          address: 'Customer Location'
        };

        await driverService.assignDriverToOrder(
          orderId,
          driver.id!,
          pickupLocation,
          deliveryLocation
        );

        // Notify customer about driver assignment
        await notificationService.sendOrderAssignedNotification(orderId, driver.name);
      }
    } catch (error) {
      console.error('Error handling order confirmation:', error);
    }
  }

  private async handleOrderPickup(orderId: string): Promise<void> {
    try {
      await notificationService.sendPickupCompletedNotification(orderId);
    } catch (error) {
      console.error('Error handling order pickup:', error);
    }
  }

  private async handleOrderCompletion(orderId: string): Promise<void> {
    try {
      await notificationService.sendDeliveryCompletedNotification(orderId);
    } catch (error) {
      console.error('Error handling order completion:', error);
    }
  }

  getOrderStep(status: Order['status']): OrderFlowStep | undefined {
    return this.orderSteps.find(step => step.status === status);
  }

  getNextStep(currentStatus: Order['status']): OrderFlowStep | undefined {
    const currentIndex = this.orderSteps.findIndex(step => step.status === currentStatus);
    return currentIndex >= 0 && currentIndex < this.orderSteps.length - 1
      ? this.orderSteps[currentIndex + 1]
      : undefined;
  }

  getProgressPercentage(status: Order['status']): number {
    const stepIndex = this.orderSteps.findIndex(step => step.status === status);
    return stepIndex >= 0 ? ((stepIndex + 1) / this.orderSteps.length) * 100 : 0;
  }

  async simulateOrderProgress(orderId: string): Promise<void> {
    // Simulate order progression for demo purposes
    const statuses: Order['status'][] = ['pending', 'confirmed', 'in-progress', 'completed'];
    
    for (let i = 0; i < statuses.length; i++) {
      setTimeout(async () => {
        await this.processOrderFlow(orderId, statuses[i]);
      }, i * 30000); // 30 seconds between each status
    }
  }
}

export const orderFlowService = new OrderFlowService();