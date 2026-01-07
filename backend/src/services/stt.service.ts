import Groq from 'groq-sdk';
import fs from 'fs';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Convert speech audio to text using Groq Whisper
 * @param audioFilePath - Path to audio file or Buffer
 * @returns Transcribed text
 */
export async function speechToText(audioFilePath: string): Promise<string> {
  try {
    // Read audio file
    const audioBuffer = fs.readFileSync(audioFilePath);

    // Create a File object from buffer
    const audioFile = new File([audioBuffer], 'audio.wav', {
      type: 'audio/wav',
    });

    // Transcribe using Groq Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'en',
      response_format: 'json',
    });

    return transcription.text || '';
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Convert speech to text from audio buffer
 * @param audioBuffer - Audio data as Buffer
 * @param filename - Filename for the audio (with extension)
 * @returns Transcribed text
 */
export async function speechToTextFromBuffer(
  audioBuffer: Buffer,
  filename: string = 'audio.wav'
): Promise<string> {
  try {
    // Create a File object from buffer
    const audioFile = new File([audioBuffer], filename, {
      type: 'audio/wav',
    });

    // Transcribe using Groq Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'en',
      response_format: 'json',
    });

    return transcription.text || '';
  } catch (error) {
    console.error('Error transcribing audio from buffer:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Transcribe audio with timestamps (for violation detection)
 * @param audioFilePath - Path to audio file
 * @returns Transcription with word-level timestamps
 */
export async function speechToTextWithTimestamps(audioFilePath: string): Promise<any> {
  try {
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioFile = new File([audioBuffer], 'audio.wav', {
      type: 'audio/wav',
    });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'en',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    return transcription;
  } catch (error) {
    console.error('Error transcribing with timestamps:', error);
    throw new Error('Failed to transcribe audio with timestamps');
  }
}
