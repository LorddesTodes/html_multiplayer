const { Worker } = require('worker_threads'); // Correctly import Worker
const path = require('path');
const fs = require('fs');

const baseDir = path.join(__dirname, 'resources/audio'); // Directory to start scanning
const convert_list = ['🔍 Scanning for OGG files...'];
let activeWorkers = 0;  // Track active workers

console.log('🚀 Starting main worker...');
startWorker(baseDir);

// Function to start a worker thread for scanning and conversion
function startWorker(directory) {
    activeWorkers++;

    const worker = new Worker(path.join(__dirname, 'audio_worker_child.js'), { 
        workerData: { directory }  // Pass the directory to the worker
    });

    worker.on('message', (msg) => {
        if (msg.type === 'log') {
            convert_list.push(msg.data);  // Collect logs from workers
        } else if (msg.type === 'done') {
            activeWorkers--;
            checkCompletion();
        } else if (msg.type === 'new') {
            activeWorkers++
        }
    });

    worker.on('exit', () => {
        activeWorkers--;
        checkCompletion();
    });

    worker.on('error', (err) => {
        console.error('❌ Worker error:', err);
        activeWorkers--;
        checkCompletion();
    });
}

// Function to check if all workers have completed
function checkCompletion() {
    if (activeWorkers <= 0) {
        console.log('🏁 All workers completed. Writing log...');
        writeLogFile();
    }
}

// Function to write the log file
function writeLogFile() {
    const now = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilePath = path.join(__dirname, 'resources/logs/audio', `latest_sound_changes-${now}.txt`);
    fs.writeFileSync(logFilePath, convert_list.join('\n'));
    console.log(`📄 Log saved to ${logFilePath}`);
}
