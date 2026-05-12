from PIL import Image, ImageSequence, ImageDraw

def process_gif(input_path, output_path):
    img = Image.open(input_path)
    
    frames = []
    for frame in ImageSequence.Iterator(img):
        # Convert to RGBA for processing
        rgba_frame = frame.convert("RGBA")
        
        # We'll use a mask to identify the background
        # Start flood fill from the four corners to catch everything outside the mascot
        width, height = rgba_frame.size
        mask = Image.new("L", (width, height), 0)
        
        # We need a temporary image to flood fill on. 
        # A grayscale version of the frame is often enough to distinguish black bg.
        # But let's use a more precise approach:
        # Create a solid color image and flood fill based on the color similarity.
        
        # For simplicity in this environment, we'll do a pixel-by-pixel flood fill 
        # starting from (0,0) if the pixel is "dark enough"
        
        data = rgba_frame.getdata()
        new_data = list(data)
        
        # Simple BFS Flood Fill for background
        target_color_threshold = 15
        visited = set()
        # Start points: all corners
        q = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
        
        while q:
            x, y = q.pop(0)
            if (x, y) in visited: continue
            visited.add((x, y))
            
            idx = y * width + x
            r, g, b, a = new_data[idx]
            
            # Use max(r,g,b) for a more accurate "darkness" check
            # Threshold 28 is a balance to catch artifacts without eating the dark outline
            if max(r, g, b) < 28:
                new_data[idx] = (0, 0, 0, 0) # Make transparent
                
                # Check neighbors
                for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                        q.append((nx, ny))
        
        rgba_frame.putdata(new_data)
        frames.append(rgba_frame)
        
    # Save the frames as a new animated GIF
    frames[0].save(output_path, 
                   save_all=True, 
                   append_images=frames[1:], 
                   optimize=False, 
                   duration=img.info.get('duration', 100), 
                   loop=img.info.get('loop', 0),
                   disposal=2)

if __name__ == "__main__":
    # We use the backup as source to avoid re-processing the "damaged" one
    import os
    source = "assets/rabit_backup.gif" if os.path.exists("assets/rabit_backup.gif") else "assets/rabit.gif"
    process_gif(source, "assets/rabit_transparent.gif")
    print(f"Success: assets/rabit_transparent.gif created from {source}")
