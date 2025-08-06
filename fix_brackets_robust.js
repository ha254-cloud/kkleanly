const fs = require('fs');
const path = require('path');
const readline = require('readline');

const filePath = path.join(__dirname, 'app', '(tabs)', 'order.tsx');
const tempPath = filePath + '.temp';

const reader = fs.createReadStream(filePath);
const writer = fs.createWriteStream(tempPath);
const rl = readline.createInterface({
  input: reader,
  crlfDelay: Infinity
});

async function processLines() {
  for await (const line of rl) {
    let processedLine = line;
    
    // Fix the syntax errors with array style brackets
    if (line.includes('style={[asArrayTextStyle([') && !line.includes('])]}>')) {
      processedLine = processedLine.replace(/style={\[asArrayTextStyle\(\[([^\]]+)\]\)}/g, 'style={asArrayTextStyle([$1])}');
    }
    
    if (line.includes('style={[asArrayViewStyle([') && !line.includes('])]}>')) {
      processedLine = processedLine.replace(/style={\[asArrayViewStyle\(\[([^\]]+)\]\)}/g, 'style={asArrayViewStyle([$1])}');
    }
    
    writer.write(processedLine + '\n');
  }
  
  writer.end();
  
  // Replace original file with the fixed one
  fs.unlinkSync(filePath);
  fs.renameSync(tempPath, filePath);
  
  console.log('All bracket syntax issues fixed successfully!');
}

processLines();
