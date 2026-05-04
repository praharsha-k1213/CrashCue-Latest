const path = require('path');

console.log('Testing imports...');

try {
    console.log('Loading middleware/auth...');
    require('./middleware/auth');
    console.log('OK');

    console.log('Loading middleware/errorHandler...');
    require('./middleware/errorHandler');
    console.log('OK');

    console.log('Loading middleware/logger...');
    require('./middleware/logger');
    console.log('OK');

    console.log('Loading services/database...');
    require('./services/database');
    console.log('OK');

    console.log('Loading services/ai-service...');
    require('./services/ai-service');
    console.log('OK');

    console.log('Loading routes/auth...');
    require('./routes/auth');
    console.log('OK');

    console.log('Loading routes/ai...');
    require('./routes/ai');
    console.log('OK');

    console.log('Loading routes/training...');
    require('./routes/training');
    console.log('OK');

    console.log('Loading routes/conversations...');
    require('./routes/conversations');
    console.log('OK');

    console.log('Loading routes/stats...');
    require('./routes/stats');
    console.log('OK');

    console.log('ALL IMPORTS SUCCESSFUL');
} catch (error) {
    console.error('IMPORT FAILED:', error);
}
