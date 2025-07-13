const { pool } = require('./config/database');

async function testOrders() {
    try {
        // Check orders count
        const [orderCount] = await pool.execute('SELECT COUNT(*) as count FROM orders');
        console.log('Total orders:', orderCount[0].count);

        // Check order items count
        const [itemCount] = await pool.execute('SELECT COUNT(*) as count FROM order_items');
        console.log('Total order items:', itemCount[0].count);

        // Get orders with item counts
        const [orders] = await pool.execute(`
            SELECT o.id, o.order_number, COUNT(oi.id) as item_count 
            FROM orders o 
            LEFT JOIN order_items oi ON o.id = oi.order_id 
            GROUP BY o.id, o.order_number
        `);
        
        console.log('\nOrders with item counts:');
        orders.forEach(order => {
            console.log(`Order ${order.order_number}: ${order.item_count} items`);
        });

        // Get a specific order with items
        if (orders.length > 0) {
            const firstOrderId = orders[0].id;
            console.log(`\nChecking order ${firstOrderId}:`);
            
            const [orderDetails] = await pool.execute(`
                SELECT o.*, u.first_name, u.last_name, u.email
                FROM orders o
                JOIN users u ON o.user_id = u.id
                WHERE o.id = ?
            `, [firstOrderId]);

            if (orderDetails.length > 0) {
                console.log('Order details:', JSON.stringify(orderDetails[0], null, 2));
            }

            const [orderItems] = await pool.execute(`
                SELECT oi.*, p.image_url
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [firstOrderId]);

            console.log(`\nOrder items (${orderItems.length}):`);
            orderItems.forEach(item => {
                console.log(`- ${item.product_name}: ${item.quantity} x ₹${item.product_price}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

testOrders(); 