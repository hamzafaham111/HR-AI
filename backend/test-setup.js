// Simple test to check if the NestJS app can be imported
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function testApp() {
  try {
    console.log('Testing NestJS app setup...');
    const app = await NestFactory.create(AppModule);
    console.log('✅ App created successfully');
    await app.close();
    console.log('✅ App closed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testApp();
