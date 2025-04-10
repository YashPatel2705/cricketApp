import axios from 'axios';

/**
 * Syncs any pending match data that was stored in localStorage
 * This can be called when the app starts or when the user navigates to the matches page
 */
export const syncPendingMatchData = async () => {
  try {
    // First check if API is available
    const apiAvailable = await isApiAvailable();
    if (!apiAvailable) {
      console.log('API is not available, skipping sync');
      return;
    }
    
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);
    
    // Find all completed match data that hasn't been synced
    const completedMatchKeys = keys.filter(key => key.startsWith('completedMatch-'));
    
    if (completedMatchKeys.length === 0) {
      console.log('No pending match data to sync');
      return;
    }
    
    console.log(`Found ${completedMatchKeys.length} pending matches to sync`);
    
    // Sync each match
    for (const key of completedMatchKeys) {
      const matchId = key.replace('completedMatch-', '');
      const matchData = JSON.parse(localStorage.getItem(key));
      
      try {
        // Try to update the match in the database
        await axios.post(`/api/matches/${matchId}/complete`, matchData);
        console.log(`Successfully synced match ${matchId}`);
        
        // Remove from localStorage after successful sync
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to sync match ${matchId}:`, error);
      }
    }
    
    // Find all points updates that haven't been synced
    const pointsUpdateKeys = keys.filter(key => key.startsWith('pointsUpdate-'));
    
    if (pointsUpdateKeys.length === 0) {
      console.log('No pending points updates to sync');
      return;
    }
    
    console.log(`Found ${pointsUpdateKeys.length} pending points updates to sync`);
    
    // Sync each points update
    for (const key of pointsUpdateKeys) {
      const matchId = key.replace('pointsUpdate-', '');
      const pointsData = JSON.parse(localStorage.getItem(key));
      
      try {
        // Try to update the points table
        await axios.post(`/api/points/update`, pointsData);
        console.log(`Successfully synced points update for match ${matchId}`);
        
        // Remove from localStorage after successful sync
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to sync points update for match ${matchId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error syncing pending match data:', error);
  }
};

/**
 * Checks if the API is available
 * @returns {Promise<boolean>} True if the API is available, false otherwise
 */
export const isApiAvailable = async () => {
  try {
    console.log('Checking API availability...');
    // Use the matches endpoint which we know works
    const response = await axios.get('/api/matches');
    console.log('API check response:', response.status);
    return true;
  } catch (error) {
    console.error('API is not available:', error);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error setting up request:', error.message);
    }
    return false;
  }
}; 