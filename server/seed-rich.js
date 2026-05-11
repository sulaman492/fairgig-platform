// server/seed-rich.js
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const BCRYPT_ROUNDS = 10;

const CONFIG = {
    WORKERS_COUNT: 36,
    COMPLAINTS_COUNT: 28,

    SHIFTS_PER_WORKER: {
        full_time: { min: 18, max: 26 },
        part_time: { min: 9, max: 15 },
        occasional: { min: 4, max: 8 },
    },

    PLATFORMS: {
        Uber: { commission: 0.25, popularity: 0.34, city_multiplier: 1.1 },
        Careem: { commission: 0.22, popularity: 0.28, city_multiplier: 1.0 },
        Foodpanda: { commission: 0.30, popularity: 0.2, city_multiplier: 0.92 },
        Bykea: { commission: 0.15, popularity: 0.1, city_multiplier: 0.82 },
        DoorDash: { commission: 0.28, popularity: 0.08, city_multiplier: 1.18 },
    },

    CITIES: {
        Karachi: { base_rate: 120, earning_potential: 1.3 },
        Lahore: { base_rate: 110, earning_potential: 1.2 },
        Islamabad: { base_rate: 130, earning_potential: 1.4 },
        Rawalpindi: { base_rate: 100, earning_potential: 1.0 },
        Multan: { base_rate: 90, earning_potential: 0.9 },
        Faisalabad: { base_rate: 95, earning_potential: 0.95 },
        Peshawar: { base_rate: 100, earning_potential: 1.0 },
        Quetta: { base_rate: 85, earning_potential: 0.85 },
    },

    COMPLAINT_CATEGORIES: {
        'High Commission': { weight: 24 },
        'Unfair Deactivation': { weight: 12 },
        'Payment Delay': { weight: 18 },
        'Technical Issue': { weight: 14 },
        'Low Rates': { weight: 12 },
        'Poor Support': { weight: 8 },
        'Wrong Deductions': { weight: 8 },
        'Account Blocked': { weight: 4 },
    },
};

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min, max) => faker.number.int({ min, max });

const randomWeighted = (items) => {
    const total = Object.values(items).reduce((sum, val) => sum + (val.weight || val), 0);
    let random = Math.random() * total;
    for (const [key, value] of Object.entries(items)) {
        const weight = value.weight || value;
        if (random < weight) return key;
        random -= weight;
    }
    return Object.keys(items)[0];
};

const randomDateDaysAgo = (minDaysAgo, maxDaysAgo) => {
    const from = new Date();
    from.setDate(from.getDate() - maxDaysAgo);

    const to = new Date();
    to.setDate(to.getDate() - minDaysAgo);

    return faker.date.between({ from, to });
};

const generateTrendData = (baseValue, daysAgo, isVulnerable) => {
    let multiplier = 1.0;

    if (daysAgo <= 30) multiplier = isVulnerable ? 0.58 : 0.82;
    else if (daysAgo <= 60) multiplier = isVulnerable ? 0.78 : 0.92;
    else multiplier = 1.0;

    const variation = 0.85 + Math.random() * 0.35;
    return Math.max(250, Math.floor(baseValue * multiplier * variation));
};

const generateWorkerType = () => {
    const rand = Math.random();
    if (rand < 0.42) return 'full_time';
    if (rand < 0.75) return 'part_time';
    return 'occasional';
};

const complaintTemplates = {
    'High Commission': [
        {
            title: 'Commission increased without notice',
            desc: 'Platform suddenly raised commission and my take-home earnings dropped sharply.',
            tags: ['commission', 'deductions'],
        },
        {
            title: 'Hidden platform fees deducted',
            desc: 'I am seeing extra service deductions in my payout statement that were never explained.',
            tags: ['fees', 'transparency'],
        },
    ],
    'Unfair Deactivation': [
        {
            title: 'Account deactivated after false complaint',
            desc: 'My account was blocked after a customer complaint that was not true.',
            tags: ['deactivation', 'account'],
        },
        {
            title: 'No explanation for suspension',
            desc: 'The platform suspended me without warning or clear reason.',
            tags: ['suspension', 'support'],
        },
    ],
    'Payment Delay': [
        {
            title: 'Weekly payment still not received',
            desc: 'My payout is delayed and support is not giving a timeline.',
            tags: ['payment', 'delay'],
        },
        {
            title: 'Completed work but earnings not settled',
            desc: 'My completed shifts are visible but the payout is still pending.',
            tags: ['payout', 'pending'],
        },
    ],
    'Technical Issue': [
        {
            title: 'App crashes during active shift',
            desc: 'The rider app crashes during peak hours and I lose orders or rides.',
            tags: ['app', 'crash'],
        },
        {
            title: 'GPS and route mapping is incorrect',
            desc: 'The app frequently shows wrong pickup or dropoff locations.',
            tags: ['gps', 'navigation'],
        },
    ],
    'Low Rates': [
        {
            title: 'Rates too low to cover fuel costs',
            desc: 'Current trip rates are too low and do not match rising transport costs.',
            tags: ['rates', 'fuel'],
        },
        {
            title: 'Base fare reduced again',
            desc: 'The platform reduced the base fare and it is no longer sustainable.',
            tags: ['fare', 'rates'],
        },
    ],
    'Poor Support': [
        {
            title: 'Support not responding properly',
            desc: 'I contacted support multiple times but only received generic replies.',
            tags: ['support', 'response'],
        },
    ],
    'Wrong Deductions': [
        {
            title: 'Incorrect deduction in payout statement',
            desc: 'The platform deducted an amount that does not match my shift record.',
            tags: ['deduction', 'payout'],
        },
    ],
    'Account Blocked': [
        {
            title: 'Profile locked and cannot work',
            desc: 'My account access was blocked and I cannot accept work anymore.',
            tags: ['account', 'blocked'],
        },
    ],
};

async function seedDatabase() {
    console.log('🌱 Starting balanced advocate-friendly seeding...\n');
    const startTime = Date.now();

    try {
        console.log('🧹 Clearing existing worker-linked data...');
        await pool.query("DELETE FROM complaints WHERE user_id IN (SELECT id FROM users WHERE role = 'worker')");
        await pool.query("DELETE FROM shifts WHERE user_id IN (SELECT id FROM users WHERE role = 'worker')");
        await pool.query("DELETE FROM users WHERE role = 'worker'");
        console.log('✅ Cleared existing workers, shifts, complaints\n');

        console.log(`👥 Creating ${CONFIG.WORKERS_COUNT} workers...`);
        const passwordHash = bcrypt.hashSync('worker123', BCRYPT_ROUNDS);
        const workerIds = [];
        const cityNames = Object.keys(CONFIG.CITIES);

        const metrics = {
            vulnerable: 0,
            byCity: {},
            byPlatform: {},
            shiftsByPeriod: { recent: 0, medium: 0, old: 0 },
            totalShiftRows: 0,
            totalComplaints: 0,
        };

        for (let i = 0; i < CONFIG.WORKERS_COUNT; i++) {
            const workerType = generateWorkerType();
            const city = randomItem(cityNames);
            const cityData = CONFIG.CITIES[city];
            const earningPotential =
                cityData.earning_potential *
                (workerType === 'full_time' ? 1.18 : workerType === 'part_time' ? 0.82 : 0.58);

            const isVulnerable = Math.random() < 0.28;

            const result = await pool.query(
                `INSERT INTO users (name, email, password, role, city, is_active, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [
                    faker.person.fullName(),
                    faker.internet.email({ provider: 'fairgig.com' }).toLowerCase(),
                    passwordHash,
                    'worker',
                    city,
                    true,
                    faker.date.past({ years: 1 }),
                ]
            );

            if (isVulnerable) metrics.vulnerable++;

            workerIds.push({
                id: result.rows[0].id,
                type: workerType,
                city,
                earningPotential,
                isVulnerable,
            });

            metrics.byCity[city] = (metrics.byCity[city] || 0) + 1;
        }
        console.log(`✅ Created ${workerIds.length} workers\n`);

        console.log('📊 Creating shifts...');
        let totalEarnings = 0;

        for (const worker of workerIds) {
            const shiftRange = CONFIG.SHIFTS_PER_WORKER[worker.type];
            const shiftsCount = randomInt(shiftRange.min, shiftRange.max);

            for (let s = 0; s < shiftsCount; s++) {
                const platform = randomWeighted(
                    Object.fromEntries(
                        Object.entries(CONFIG.PLATFORMS).map(([name, data]) => [name, data.popularity])
                    )
                );

                const platformData = CONFIG.PLATFORMS[platform];
                const daysAgo = randomInt(1, 90);
                const shiftDateObj = randomDateDaysAgo(daysAgo, daysAgo + 1);
                const shiftDate = shiftDateObj.toISOString().split('T')[0];

                // Track period distribution
                if (daysAgo <= 30) metrics.shiftsByPeriod.recent++;
                else if (daysAgo <= 60) metrics.shiftsByPeriod.medium++;
                else metrics.shiftsByPeriod.old++;

                const cityData = CONFIG.CITIES[worker.city];
                const baseEarnings =
                    cityData.base_rate *
                    worker.earningPotential *
                    platformData.city_multiplier *
                    (worker.type === 'full_time' ? 1.12 : worker.type === 'part_time' ? 0.88 : 0.7);

                const grossEarned = generateTrendData(baseEarnings * 10, daysAgo, worker.isVulnerable);
                const commissionRate = platformData.commission * (0.92 + Math.random() * 0.18);
                const deductions = Math.floor(grossEarned * commissionRate);
                const netReceived = grossEarned - deductions;
                const hoursWorked = faker.number.float({
                    min: worker.type === 'full_time' ? 7 : worker.type === 'part_time' ? 4 : 3,
                    max: worker.type === 'full_time' ? 12 : worker.type === 'part_time' ? 8 : 6,
                    fractionDigits: 1,
                });

                let verificationStatus = 'confirmed';
                const rand = Math.random();
                if (rand < 0.1) verificationStatus = 'pending';
                else if (rand < 0.14) verificationStatus = 'discrepancy';

                await pool.query(
                    `INSERT INTO shifts (
                        user_id, platform, shift_date, hours_worked,
                        gross_earned, platform_deductions, net_received,
                        verification_status, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        worker.id,
                        platform,
                        shiftDate,
                        hoursWorked,
                        grossEarned,
                        deductions,
                        netReceived,
                        verificationStatus,
                        shiftDateObj,
                    ]
                );

                metrics.totalShiftRows++;
                totalEarnings += netReceived;

                if (!metrics.byPlatform[platform]) {
                    metrics.byPlatform[platform] = {
                        shifts: 0,
                        totalCommission: 0,
                        totalGross: 0,
                    };
                }

                metrics.byPlatform[platform].shifts++;
                metrics.byPlatform[platform].totalCommission += deductions;
                metrics.byPlatform[platform].totalGross += grossEarned;
            }
        }

        console.log(`✅ Created ${metrics.totalShiftRows} shifts`);
        console.log(`💰 Total net earnings: PKR ${totalEarnings.toLocaleString()}`);
        console.log(`📅 Shift Distribution: Recent=${metrics.shiftsByPeriod.recent}, Medium=${metrics.shiftsByPeriod.medium}, Old=${metrics.shiftsByPeriod.old}\n`);

        console.log(`📝 Creating ${CONFIG.COMPLAINTS_COUNT} complaints...`);

        for (let i = 0; i < CONFIG.COMPLAINTS_COUNT; i++) {
            const worker = randomItem(workerIds);
            const category = randomWeighted(CONFIG.COMPLAINT_CATEGORIES);
            const template = randomItem(complaintTemplates[category] || complaintTemplates['Technical Issue']);
            const daysAgo = randomInt(1, 60);

            let platform;
            if (category === 'High Commission') platform = randomItem(['Uber', 'Foodpanda', 'DoorDash']);
            else if (category === 'Payment Delay') platform = randomItem(['Careem', 'Uber']);
            else platform = randomItem(Object.keys(CONFIG.PLATFORMS));

            let status = 'pending';
            const statusRand = Math.random();
            if (statusRand < 0.5) status = 'pending';
            else if (statusRand < 0.78) status = 'escalated';
            else status = 'resolved';

            const upvotes = randomInt(0, 55);
            const clusterId = randomInt(1000, 9999);

            const tags = [...template.tags];
            if (worker.city) tags.push(worker.city.toLowerCase());
            tags.push(platform.toLowerCase());

            await pool.query(
                `INSERT INTO complaints (
                    user_id, platform, category, title, description,
                    status, upvotes, tags, cluster_id, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    worker.id,
                    platform,
                    category,
                    template.title,
                    `${template.desc} ${randomItem([
                        'Please help resolve this.',
                        'This is affecting my income badly.',
                        'I already contacted support but no result.',
                        'I need urgent intervention.',
                    ])}`,
                    status,
                    upvotes,
                    tags,
                    clusterId,
                    randomDateDaysAgo(daysAgo, daysAgo + 1),
                ]
            );

            metrics.totalComplaints++;
        }

        console.log(`✅ Created ${metrics.totalComplaints} complaints\n`);

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('📊 =========================================');
        console.log('   SEEDING COMPLETE');
        console.log('📊 =========================================');
        console.log(`⏱️  Time taken: ${duration}s`);
        console.log(`👥 Workers: ${workerIds.length}`);
        console.log(`   - Full-time: ${workerIds.filter(w => w.type === 'full_time').length}`);
        console.log(`   - Part-time: ${workerIds.filter(w => w.type === 'part_time').length}`);
        console.log(`   - Occasional: ${workerIds.filter(w => w.type === 'occasional').length}`);
        console.log(`   - Vulnerable (28%): ${metrics.vulnerable}`);
        console.log(`📊 Shifts: ${metrics.totalShiftRows}`);
        console.log(`📝 Complaints: ${metrics.totalComplaints}`);

        console.log('\n🏙️  City Distribution:');
        Object.entries(metrics.byCity)
            .sort((a, b) => b[1] - a[1])
            .forEach(([city, count]) => {
                console.log(`   ${city}: ${count} workers`);
            });

        console.log('\n🔐 Login credentials:');
        console.log('   Password for ALL workers: worker123');

        const sampleEmails = await pool.query(
            `SELECT email FROM users WHERE role = 'worker' ORDER BY created_at DESC LIMIT 5`
        );

        console.log('   Sample worker emails:');
        sampleEmails.rows.forEach((row) => console.log(`   - ${row.email}`));

        const shiftSummary = await pool.query(`
            SELECT
                COUNT(*) AS total_confirmed_shifts,
                COUNT(DISTINCT user_id) AS active_workers,
                COALESCE(SUM(net_received), 0) AS total_net_earnings,
                COALESCE(AVG(net_received), 0) AS avg_net_per_shift
            FROM shifts
            WHERE verification_status = 'confirmed'
        `);

        const complaintSummary = await pool.query(`
            SELECT
                COUNT(*) AS total_complaints,
                COUNT(*) FILTER (WHERE status = 'escalated') AS escalated_complaints,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending_complaints
            FROM complaints
        `);

        console.log('\n📈 Analytics Summary:');
        console.log(`   Active workers: ${shiftSummary.rows[0].active_workers}`);
        console.log(`   Confirmed shifts: ${shiftSummary.rows[0].total_confirmed_shifts}`);
        console.log(`   Total net earnings: PKR ${Math.floor(shiftSummary.rows[0].total_net_earnings).toLocaleString()}`);
        console.log(`   Avg net per shift: PKR ${Math.floor(shiftSummary.rows[0].avg_net_per_shift).toLocaleString()}`);
        console.log(`   Total complaints: ${complaintSummary.rows[0].total_complaints}`);
        console.log(`   Escalated complaints: ${complaintSummary.rows[0].escalated_complaints}`);
        console.log(`   Pending complaints: ${complaintSummary.rows[0].pending_complaints}`);

        console.log('\n✅ Seeding completed successfully!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

seedDatabase();