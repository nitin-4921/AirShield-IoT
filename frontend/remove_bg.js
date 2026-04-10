import Jimp from 'jimp';

async function removeWhiteBg() {
  try {
    const image = await Jimp.read('./public/character_sprite.png');
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If the pixel is mostly white/very light, make it transparent
      if (r > 240 && g > 240 && b > 240) {
        this.bitmap.data[idx + 3] = 0; // alpha
      }
    });

    await image.writeAsync('./public/character_sprite.png');
    console.log('Successfully made white background transparent!');
  } catch (err) {
    console.error('Failure removing background:', err);
  }
}

removeWhiteBg();
