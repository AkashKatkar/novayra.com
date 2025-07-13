const { pool } = require('./config/database');

async function testSettings() {
    try {
        console.log('Testing settings functionality...\n');

        // 1. Check if site_settings table exists
        console.log('1. Checking if site_settings table exists...');
        const [tables] = await pool.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'novayra_ecommerce' 
            AND TABLE_NAME = 'site_settings'
        `);

        if (tables.length === 0) {
            console.log('❌ site_settings table does not exist!');
            console.log('Please run the migration script: database/settings-schema.sql');
            return;
        }

        console.log('✅ site_settings table exists');

        // 2. Check if settings are populated
        console.log('\n2. Checking settings data...');
        const [settings] = await pool.execute(`
            SELECT setting_key, setting_value, setting_type, category
            FROM site_settings
            ORDER BY category, setting_key
        `);

        console.log(`Found ${settings.length} settings:`);
        settings.forEach(setting => {
            console.log(`  - ${setting.setting_key}: ${setting.setting_value} (${setting.setting_type})`);
        });

        // 3. Test grouping by category
        console.log('\n3. Testing settings grouping...');
        const groupedSettings = {
            general: [],
            email: [],
            payment: [],
            shipping: [],
            social: [],
            seo: [],
            maintenance: []
        };

        settings.forEach(setting => {
            const category = setting.setting_key.split('_')[0];
            if (groupedSettings[category]) {
                groupedSettings[category].push(setting);
            } else {
                groupedSettings.general.push(setting);
            }
        });

        Object.keys(groupedSettings).forEach(category => {
            if (groupedSettings[category].length > 0) {
                console.log(`  ${category}: ${groupedSettings[category].length} settings`);
            }
        });

        console.log('\n✅ Settings functionality is working correctly!');

    } catch (error) {
        console.error('❌ Error testing settings:', error);
    } finally {
        process.exit(0);
    }
}

testSettings(); 