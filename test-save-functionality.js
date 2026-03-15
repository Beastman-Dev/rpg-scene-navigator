// Simple test to verify save functionality
const { getDatabaseManager, initializeDatabase } = require('./dist/assets/index--o7YjyIT.js');

async function testSaveFunctionality() {
  try {
    console.log('🧪 Testing save functionality...');
    
    // Initialize database
    const dbManager = getDatabaseManager();
    await initializeDatabase();
    
    // Test creating an adventure
    const adventureData = {
      title: 'Test Adventure',
      description: 'A test adventure for save functionality',
      tags: ['test', 'save'],
      status: 'draft',
      author: 'Test User'
    };
    
    console.log('📝 Creating test adventure:', adventureData);
    
    // This would normally be called through the AdventureRepository
    // For now, we'll just verify the mock database is working
    const connection = dbManager.getConnection();
    const result = connection.prepare('INSERT INTO adventures (title, description, tags, status, author, id, created_at, updated_at, starting_scene_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      adventureData.title,
      adventureData.description,
      JSON.stringify(adventureData.tags),
      adventureData.status,
      adventureData.author,
      'test-adv-1',
      new Date().toISOString(),
      new Date().toISOString(),
      'test-scene-1'
    );
    
    console.log('✅ Adventure created successfully:', result);
    
    // Test reading the adventure back
    const adventures = connection.prepare('SELECT * FROM adventures').all();
    console.log('📋 All adventures:', adventures);
    
    console.log('🎉 Save functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSaveFunctionality();
