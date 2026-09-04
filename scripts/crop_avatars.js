const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function processAllAvatars() {
  const brainDir = 'C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\857a526d-c522-466a-a684-8a53e45f30cc';
  const outDir = path.join(__dirname, '..', 'assets', 'avatars');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Process original uploaded image
  const srcPath = path.join(brainDir, '.user_uploaded', 'media_1788558347914.jpg');
  if (fs.existsSync(srcPath)) {
    const image = await Jimp.read(srcPath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Female character (left half)
    const femaleHalf = image.clone();
    femaleHalf.crop({ x: 0, y: 0, w: Math.floor(width / 2), h: height });
    const fMin = Math.min(femaleHalf.bitmap.width, femaleHalf.bitmap.height);
    const femaleSq = femaleHalf.clone();
    femaleSq.crop({ x: Math.floor((femaleHalf.bitmap.width - fMin) / 2), y: 0, w: fMin, h: fMin });
    femaleSq.resize({ w: 400, h: 400 });
    await femaleSq.write(path.join(outDir, 'female_doctor_1.png'));

    // Male character (right half)
    const maleHalf = image.clone();
    maleHalf.crop({ x: Math.floor(width / 2), y: 0, w: Math.floor(width / 2), h: height });
    const mMin = Math.min(maleHalf.bitmap.width, maleHalf.bitmap.height);
    const maleSq = maleHalf.clone();
    maleSq.crop({ x: Math.floor((maleHalf.bitmap.width - mMin) / 2), y: 0, w: mMin, h: mMin });
    maleSq.resize({ w: 400, h: 400 });
    await maleSq.write(path.join(outDir, 'male_doctor_1.png'));
  }

  // 2. Process generated images
  const files = fs.readdirSync(brainDir);
  for (const f of files) {
    if (f.startsWith('anime_female_doctor_1') && f.endsWith('.jpg')) {
      const img = await Jimp.read(path.join(brainDir, f));
      img.resize({ w: 400, h: 400 });
      await img.write(path.join(outDir, 'female_doctor_2.png'));
      console.log('Saved female_doctor_2.png');
    }
    if (f.startsWith('anime_male_doctor_2') && f.endsWith('.jpg')) {
      const img = await Jimp.read(path.join(brainDir, f));
      img.resize({ w: 400, h: 400 });
      await img.write(path.join(outDir, 'male_doctor_2.png'));
      console.log('Saved male_doctor_2.png');
    }
    if (f.startsWith('anime_female_doctor_3') && f.endsWith('.jpg')) {
      const img = await Jimp.read(path.join(brainDir, f));
      img.resize({ w: 400, h: 400 });
      await img.write(path.join(outDir, 'female_doctor_3.png'));
      console.log('Saved female_doctor_3.png');
    }
  }

  console.log('Processed all avatar image assets!');
}

processAllAvatars().catch(console.error);
