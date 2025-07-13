const { pool } = require('./config/database');

async function checkOrderItems() {
    try {
        // Get all orders with their item counts
        const [orders] = await pool.execute(`
            SELECT o.id, o.order_number, COUNT(oi.id) as item_count 
            FROM orders o 
            LEFT JOIN order_items oi ON o.id = oi.order_id 
            GROUP BY o.id, o.order_number
            ORDER BY o.id
        `);
        
        console.log('Orders with item counts:');
        orders.forEach(order => {
            console.log(`Order ${order.id} (${order.order_number}): ${order.item_count} items`);
        });

        // Show items for orders that have them
        console.log('\nDetailed items for orders with items:');
        for (const order of orders) {
            if (order.item_count > 0) {
                const [items] = await pool.execute(`
                    SELECT oi.product_name, oi.quantity, oi.product_price
                    FROM order_items oi
                    WHERE oi.order_id = ?
                `, [order.id]);
                
                console.log(`\nOrder ${order.id} (${order.order_number}):`);
                items.forEach(item => {
                    console.log(`  - ${item.product_name}: ${item.quantity} x ₹${item.product_price}`);
                });
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkOrderItems(); 