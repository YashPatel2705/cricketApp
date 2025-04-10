const express = require('express');
const router = express.Router();
const Match = require('../models/Match');

// Complete a match and update its data
router.post('/:matchId/complete', async (req, res) => {
  try {
    console.log("📥 Incoming match completion data:", req.body);
    const { matchId } = req.params;
    const matchData = req.body;

    // Validate required fields
    if (!matchData.firstInningsScore || !matchData.secondInningsScore) {
      return res.status(400).json({ error: 'Missing required match data' });
    }

    // Update match in database with complete match data
    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      {
        $set: {
          ...matchData,
          status: 'completed',
          completedAt: new Date(),
          firstInnings: {
            score: matchData.firstInningsScore,
            wickets: matchData.firstInningsWickets,
            overs: matchData.firstInningsOvers
          },
          secondInnings: {
            score: matchData.secondInningsScore,
            wickets: matchData.secondInningsWickets,
            overs: matchData.secondInningsOvers
          },
          result: matchData.result,
          winningTeam: matchData.winningTeam,
          ballByBall: matchData.ballByBall || [],
          overHistory: matchData.overHistory || []
        }
      },
      { new: true }
    ).populate('teamA', 'name image')
     .populate('teamB', 'name image')
     .populate('winningTeam', 'name image');

    if (!updatedMatch) {
      console.error('❌ Match not found:', matchId);
      return res.status(404).json({ error: 'Match not found' });
    }

    console.log("✅ Match completed successfully:", updatedMatch._id);
    res.json(updatedMatch);
  } catch (error) {
    console.error('❌ Error completing match:', error);
    res.status(500).json({ error: 'Failed to complete match', details: error.message });
  }
});

module.exports = router; 