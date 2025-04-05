/**
 * Sends a tap record to ThingSpeak
 * 
 * @param deviceId - The ID of the device that registered the tap
 * @param tapCount - The number of taps to record (default: 1)
 * @returns The response from ThingSpeak
 */
export async function recordTap(deviceId: number, tapCount: number = 1): Promise<{ entry_id: number }> {
  const apiKey = process.env.THINGSPEAK_API_KEY;
  
  if (!apiKey) {
    throw new Error('THINGSPEAK_API_KEY environment variable is not set');
  }
  
  try {
    // ThingSpeak API endpoint
    const url = `https://api.thingspeak.com/update.json`;
    
    // Prepare the data for ThingSpeak
    // Using field1 for deviceId and field2 for tapCount
    const formData = new URLSearchParams();
    formData.append('api_key', apiKey);
    formData.append('field1', deviceId.toString());
    formData.append('field2', tapCount.toString());
    
    // Send the data to ThingSpeak
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    if (!response.ok) {
      throw new Error(`ThingSpeak API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error recording tap on ThingSpeak:', error);
    throw new Error('Failed to record tap on ThingSpeak');
  }
} 