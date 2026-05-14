import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883', {
  username: process.env.MQTT_USERNAME || 'pinball_user',
  password: process.env.MQTT_PASSWORD || 'change_me',
});

client.on('connect', () => {
    console.log('✅ Connected to Mosquitto');

    client.subscribe('pinball/test/ping', (err) => {
        if (!err) {
            console.log('📡 Subscribed to pinball/test/ping');
            client.publish('pinball/test/ping', 'Hello from test-mqtt.js');
        }
    });
});

client.on('message', (topic, message) => {
    console.log(`📥 Received message on [${topic}]: ${message.toString()}`);
    if (message.toString() === 'Hello from test-mqtt.js') {
        console.log('🎯 Test successful! Round-trip message verified.');
        client.end();
        process.exit(0);
    }
});

client.on('error', (err) => {
    console.error('❌ Connection error:', err);
    process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.error('⌛ Test timed out');
    process.exit(1);
}, 10000);
