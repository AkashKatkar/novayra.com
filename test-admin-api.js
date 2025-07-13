import fetch from 'node-fetch';

async function testAdminAPI() {
    try {
        // First, let's login as admin to get a token
        console.log('Testing admin login...');
        const loginResponse = await fetch('http://localhost:3000/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@novayra.com',
                password: 'admin123'
            })
        });

        if (!loginResponse.ok) {
            throw new Error('Admin login failed');
        }

        const loginData = await loginResponse.json();
        console.log('Login successful');
        
        const adminToken = loginData.token;

        // Test getting all orders
        console.log('\nTesting get all orders...');
        const ordersResponse = await fetch('http://localhost:3000/api/admin/orders?limit=5', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!ordersResponse.ok) {
            throw new Error('Failed to get orders');
        }

        const ordersData = await ordersResponse.json();
        console.log('Orders response:', JSON.stringify(ordersData, null, 2));

        // Test getting a specific order
        if (ordersData.orders && ordersData.orders.length > 0) {
            const firstOrderId = ordersData.orders[0].id;
            console.log(`\nTesting get order ${firstOrderId}...`);
            
            const orderResponse = await fetch(`http://localhost:3000/api/admin/orders/${firstOrderId}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            if (!orderResponse.ok) {
                throw new Error('Failed to get order details');
            }

            const orderData = await orderResponse.json();
            console.log('Order details:', JSON.stringify(orderData, null, 2));
            
            // Check if order has items
            if (orderData.order && orderData.order.items) {
                console.log(`\nOrder has ${orderData.order.items.length} items:`);
                orderData.order.items.forEach(item => {
                    console.log(`- ${item.product_name}: ${item.quantity} x ₹${item.product_price}`);
                });
            } else {
                console.log('\nNo items found in order');
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAdminAPI(); 