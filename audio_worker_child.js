const { parentPort, workerData, Worker } = require('worker_threads'); // Import required modules
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegStatic); // Set the ffmpeg path for conversion

const directory = workerData.directory;  // Get directory data from the main thread
let workerCount = 0;  // Track number of directories being processed

// Function to scan directories
function scanDirectories(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // If it's a directory, recursively scan the directory
            workerCount++;
            parentPort.postMessage({type:"new"})
            const worker = new Worker(__filename, { workerData: { directory: fullPath } });

        } else if (entry.isFile() && entry.name.endsWith('.ogg')) {
            // If it's an OGG file, convert it
            convertToMp3(fullPath);
        }
    }

    // After scanning all files in the directory, check if worker should exit
    checkShutdown();
}

// Function to convert OGG to MP3
function convertToMp3(oggFilePath) {
    const mp3FilePath = oggFilePath.replace(/\.ogg$/, '.mp3');

    if (fs.existsSync(mp3FilePath)) {
        parentPort.postMessage({ type: 'log', data: `✅ MP3 already exists: ${mp3FilePath}` });
        return;
    }

    parentPort.postMessage({ type: 'log', data: `🎵 Converting: ${oggFilePath} → ${mp3FilePath}` });

    // ffmpeg conversion process
    ffmpeg(oggFilePath)
        .toFormat('mp3')
        .on('start', (commandLine) => {
            //console.log(`FFMPEG started with command: ${commandLine}`);
        })
        .on('progress', (progress) => {
            //console.log(`Conversion progress: ${progress.percent}% done`);
        })
        .on('end', () => {
            parentPort.postMessage({ type: 'log', data: `✅ Converted: ${mp3FilePath}` });
            fs.rmSync(oggFilePath)
        })
        .on('error', (err) => {
            console.error(`❌ Error converting ${oggFilePath}: ${err}`);
            parentPort.postMessage({ type: 'log', data: `❌ Error: ${err}` });
        })
        .save(mp3FilePath);
}

// Check if worker can shut down (when all directories have been processed)
function checkShutdown() {
    if (workerCount === 0) {
        parentPort.postMessage({ type: 'done' });  // Notify main thread that this worker is done
        process.exit(0);  // Exit the worker thread
    }
}

// Start scanning the initial directory
scanDirectories(directory);
