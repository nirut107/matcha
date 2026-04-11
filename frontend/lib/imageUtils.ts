// lib/imageUtils.ts
export const getEditedImage = async (
	imageSrc: string,
	pixelCrop: { x: number; y: number; width: number; height: number },
	rotation: number = 0,
	filter: string = 'none'
  ): Promise<{ file: File; url: string } | null> => {
	const image = new Image();
	image.crossOrigin = "anonymous";
	image.src = imageSrc;
	await new Promise((resolve) => (image.onload = resolve));

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;

	// 1. Calculate bounding box of the rotated image
	const angleRadian = (rotation * Math.PI) / 180;
	const boundingBoxWidth = Math.abs(Math.cos(angleRadian) * image.width) + Math.abs(Math.sin(angleRadian) * image.height);
	const boundingBoxHeight = Math.abs(Math.sin(angleRadian) * image.width) + Math.abs(Math.cos(angleRadian) * image.height);

	canvas.width = boundingBoxWidth;
	canvas.height = boundingBoxHeight;

	// 2. Rotate around the center
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.rotate(angleRadian);
	ctx.translate(-image.width / 2, -image.height / 2);

	// 3. Apply selected filter
	ctx.filter = filter;
	ctx.drawImage(image, 0, 0);

	// 4. Extract only the cropped area
	const croppedCanvas = document.createElement("canvas");
	const croppedCtx = croppedCanvas.getContext("2d");
	if (!croppedCtx) return null;

	croppedCanvas.width = pixelCrop.width;
	croppedCanvas.height = pixelCrop.height;

	croppedCtx.drawImage(
	  canvas,
	  pixelCrop.x,
	  pixelCrop.y,
	  pixelCrop.width,
	  pixelCrop.height,
	  0,
	  0,
	  pixelCrop.width,
	  pixelCrop.height
	);

	// 5. Convert back to File & Object URL
	return new Promise((resolve) => {
	  croppedCanvas.toBlob((blob) => {
		if (!blob) return resolve(null);
		const file = new File([blob], `edited-${Date.now()}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
		resolve({ file, url: URL.createObjectURL(blob) });
	  }, "image/jpeg", 0.9);
	});
  };
