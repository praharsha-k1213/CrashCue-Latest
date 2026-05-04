try {
    console.log('Testing @google/generative-ai...');
    require('@google/generative-ai');
    console.log('Google AI OK');

    console.log('Testing openai...');
    require('openai');
    console.log('OpenAI OK');

    console.log('Testing express-validator...');
    require('express-validator');
    console.log('Validator OK');
} catch (error) {
    console.error('DEP FAIL:', error);
}
