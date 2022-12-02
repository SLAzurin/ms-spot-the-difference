const c = document.getElementById('spotdiff');

// let cycle; // flash animation

// let cnum = 0;

const colour_match = (a, b) => {
  // Compare pixel rgb 0 - 255
  return ((Math.abs(a[0] - b[0]) < 4) && (Math.abs(a[1] - b[1]) < 4) && (Math.abs(a[2] - b[2]) < 4));
}

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

const spot_diff = async (blob) => {
  // Clear all previous executions
  while (c.firstChild) c.removeChild(c.firstChild);

  // clearInterval(cycle);

  const img = document.getElementById('preview');

  await new Promise(resolve => {
    img.onload = resolve;
    img.src = window.URL.createObjectURL(blob);
    img.style.display = 'none';
  });

  // Save pasted image to canvas
  const canvas = document.createElement("canvas");

  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext("2d").drawImage(img, 0, 0);

  const image = canvas.getContext("2d", { willReadFrequently: true });

  // Save identifier image to subcanvas (This canvas is used below to fix positioning)
  const subimg = new Image();

  await new Promise(resolve => {
    subimg.onload = resolve;
    // Check a.png for content (small line)
    subimg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAABCAYAAACCGM0BAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAABzSURBVBhXPY4BEcAwCAMzCbGAhVqYhVmYylmohVqohC2BY73eEcKT9rgH302CG9iEqgRSpNFeMaqayUrEqOxfWLuNIHQxl/jOywyztWP7OqP2MmJjzqXWXZ3lHS1RfxkjxGn2f9RE636jch7lZJ+suT7EB89JOd6zhBqEAAAAAElFTkSuQmCC';
    subimg.style.display = 'block';
  });

  const subcanvas = document.createElement("canvas");

  subcanvas.width = subimg.width;
  subcanvas.height = subimg.height;
  subcanvas.getContext("2d").drawImage(subimg, 0, 0);

  const image2 = subcanvas.getContext("2d", { willReadFrequently: true });


  // find image2 in image canvas
  let matchstreak = 0;
  let done = false;

  let coords = { x: 0, y: 0 };

  for (let y = 0; y < canvas.height; y++) {
    matchstreak = 0;

    for (let x = 0; x <= (canvas.width - subcanvas.width); x++) {
      const canvas_pixel = image.getImageData(x, y, 1, 1);
      const subcanvas_pixel = image2.getImageData(matchstreak, 0, 1, 1);

      if (colour_match(canvas_pixel.data, subcanvas_pixel.data)) {
        matchstreak++;
      } else {
        matchstreak = 0;
      }

      if (matchstreak === subcanvas.width) {
        coords.x = x;
        coords.y = y;
        done = true;
        break;
      }
    }

    if (done) break;
  }

  // find coordinates 0,0 the 2 diff areas from maple client
  const diff_width = 450;
  const diff_height = 450;

  const diff_y = 28;
  const diff_x1 = -256;
  const diff_x2 = 202;

  const left_img_data = image.getImageData(coords.x + diff_x1, coords.y + diff_y, diff_width, diff_height);
  const right_img_data = image.getImageData(coords.x + diff_x2, coords.y + diff_y, diff_width, diff_height);

  const left_canvas = document.createElement("canvas");
  const right_canvas = document.createElement("canvas");

  left_canvas.width = diff_width;
  left_canvas.height = diff_height;

  right_canvas.width = diff_width;
  right_canvas.height = diff_height;

  left_canvas.getContext("2d").putImageData(left_img_data, 0, 0);
  right_canvas.getContext("2d").putImageData(right_img_data, 0, 0);

  c.appendChild(left_canvas);

  const left_ctx = left_canvas.getContext("2d", { willReadFrequently: true });
  const right_ctx = right_canvas.getContext("2d", { willReadFrequently: true });

  const diff_canvas_b = document.createElement("canvas");
  diff_canvas_b.width = diff_width;
  diff_canvas_b.height = diff_height;

  // const diff_canvas = document.createElement("canvas");
  // diff_canvas.width = diff_width;
  // diff_canvas.height = diff_height;

  // const diff_canvas2 = document.createElement("canvas");
  // diff_canvas2.width = diff_width;
  // diff_canvas2.height = diff_height;

  const diff_b_ctx = diff_canvas_b.getContext("2d");
  // const diff_ctx = diff_canvas.getContext("2d");
  // const diff_ctx2 = diff_canvas2.getContext("2d");

  // diff_ctx.putImageData(left_ctx.getImageData(0, 0, diff_width, diff_height), 0, 0);
  // diff_ctx2.putImageData(left_ctx.getImageData(0, 0, diff_width, diff_height), 0, 0);

  diff_b_ctx.fillStyle = 'black';
  diff_b_ctx.fillRect(0, 0, diff_width, diff_height);

  for (let y = 0; y < diff_height; y++) {
    for (let x = 0; x < diff_width; x++) {
      const left_px = left_ctx.getImageData(x, y, 1, 1);
      const right_px = right_ctx.getImageData(x, y, 1, 1);

      if (!colour_match(left_px.data, right_px.data)) {
        const r = new ImageData(new Uint8ClampedArray([255, 0, 0, 255]), left_px.width, left_px.height);
        const g = new ImageData(new Uint8ClampedArray([0, 255, 0, 255]), left_px.width, left_px.height);
        const b = new ImageData(new Uint8ClampedArray([0, 0, 255, 255]), left_px.width, left_px.height);
        // console.log(r,g,b)
        left_ctx.putImageData(r, x, y);
        // diff_ctx.putImageData(g, x, y);
        // diff_ctx2.putImageData(b, x, y);
        diff_b_ctx.putImageData(right_px, x, y);
      }
    }
  }

  left_canvas.style.display = 'inline';
  // diff_canvas.style.display = 'none';
  // diff_canvas2.style.display = 'none';

  // c.appendChild(diff_canvas);
  // c.appendChild(diff_canvas2);
  c.appendChild(diff_canvas_b);

  // cycle = setInterval(() => {
  //   cnum = (cnum + 1) % 3;
  //   switch (cnum) {
  //     case 0:
  //       left_canvas.style.display = 'inline';
  //       diff_canvas.style.display = 'none';
  //       diff_canvas2.style.display = 'none';
  //       break;
  //     case 1:
  //       left_canvas.style.display = 'none';
  //       diff_canvas.style.display = 'inline';
  //       diff_canvas2.style.display = 'none';
  //       break;
  //     case 2:
  //       left_canvas.style.display = 'none';
  //       diff_canvas.style.display = 'none';
  //       diff_canvas2.style.display = 'inline';
  //       break;
  //   }
  // }, 1000);
};

document.onpaste = (event) => {
  const items = (event.clipboardData ?? event.originalEvent.clipboardData).items;
//   console.log(event);
  for (const item of items) {
    if (item.kind === "file") {
    //   console.log(item);
      const blob = item.getAsFile();
    //   console.log(blob);
      spot_diff(blob);
    }
  }
};
