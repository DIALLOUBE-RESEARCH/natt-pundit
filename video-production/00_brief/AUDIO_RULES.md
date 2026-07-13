# Audio rules — montage CapCut

## Veo 3.1

- **Default API behaviour:** Veo 3.1 **always** bakes audio into the MP4 on Gemini API (`generate_audio` not supported).
- **Our pipeline:** after each Veo export, `generate_pilot_veo.py` writes a **`*_silent_9x16.mp4`** (ffmpeg strip). Use that file in CapCut.

## If a clip still has sound

1. CapCut: detach/delete audio track on the Veo clip.
2. Or ffmpeg:
   ```powershell
   ffmpeg -i input.mp4 -c copy -an output_silent.mp4
   ```

## VO style (locked)

- **Male** documentary narrator — voice `Charon` (not Kore).
- Netflix-style: deep, slow, authoritative, zero hype.
- See `01_scripts/pilot_00-40_vo.txt`.

## Export final

- Canvas CapCut: **9:16** (1080x1920).
- scrcpy captures are already vertical (phone).
