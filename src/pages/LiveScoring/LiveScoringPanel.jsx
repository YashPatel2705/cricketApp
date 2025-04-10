import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useMatchStore from '../../store/useMatchStore';
import useTeamStore from '../../store/useTeamStore';
import socket from '../../utils/socket';
import axios from 'axios';
import { syncPendingMatchData, isApiAvailable } from '../../utils/apiSync';

const LiveScoringPanel = () => {
  const { matchId } = useParams();
  const { matches, fetchMatches } = useMatchStore();
  const { teams, fetchTeams } = useTeamStore();
  const navigate = useNavigate();

  const [batsman1, setBatsman1] = useState(null);
  const [batsman2, setBatsman2] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [match, setMatch] = useState(null);
  const [toss, setToss] = useState(null);
  const [isMatchStarted, setIsMatchStarted] = useState(false);
  const [isMatchPaused, setIsMatchPaused] = useState(false);
  const [recentBalls, setRecentBalls] = useState([]);
  const [overStarted, setOverStarted] = useState(false);
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [strike, setStrike] = useState('batsman1');
  const [ballHistory, setBallHistory] = useState([]);
  const [currentInnings, setCurrentInnings] = useState(1);
  const [showSecondInningsPrompt, setShowSecondInningsPrompt] = useState(false);
  const [isInningsComplete, setIsInningsComplete] = useState(false);
  const [firstInningsScore, setFirstInningsScore] = useState(0);
  const [firstInningsWickets, setFirstInningsWickets] = useState(0);
  const [firstInningsOvers, setFirstInningsOvers] = useState(0);
  const [showSecondInningsConfirmation, setShowSecondInningsConfirmation] = useState(false);
  const [runsToWin, setRunsToWin] = useState(0);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [winningTeam, setWinningTeam] = useState(null);
  const [enhancedBallHistory, setEnhancedBallHistory] = useState([]);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState('');
  const [fielder, setFielder] = useState('');
  const [nextBatsman, setNextBatsman] = useState('');
  const [dismissedBatsman, setDismissedBatsman] = useState('');
  const [battingTeamPlayers, setBattingTeamPlayers] = useState([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState([]);
  const [outPlayers, setOutPlayers] = useState([]);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [selectedBowler, setSelectedBowler] = useState('');
  const [previousBowlers, setPreviousBowlers] = useState([]);
  const [currentOverStats, setCurrentOverStats] = useState({ runs: 0, wickets: 0, balls: [], legalDeliveries: 0 });
  const [overHistory, setOverHistory] = useState([]);
  const [bowlerStats, setBowlerStats] = useState({});
  const [batsmanStats, setBatsmanStats] = useState({
    batsman1: { runs: 0, balls: 0, fours: 0, sixes: 0 },
    batsman2: { runs: 0, balls: 0, fours: 0, sixes: 0 }
  });
  const [showNextOverButton, setShowNextOverButton] = useState(false);
  const [isOverComplete, setIsOverComplete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [undoCountInOver, setUndoCountInOver] = useState(0);
  const [isLastWicket, setIsLastWicket] = useState(false);

  useEffect(() => {
    fetchMatches();
    fetchTeams();
    socket.emit('joinMatch', matchId);

    const savedState = JSON.parse(localStorage.getItem(`score-${matchId}`));
    if (savedState) {
      setRuns(savedState.runs || 0);
      setWickets(savedState.wickets || 0);
      setBalls(savedState.balls || 0);
      setRecentBalls(savedState.recentBalls || []);
      setStrike(savedState.strike || 'batsman1');
      
      if (savedState.batsmanStats) {
        setBatsmanStats(savedState.batsmanStats);
      }

      if (savedState.bowlerStats) {
        setBowlerStats(savedState.bowlerStats);
      }

      if (savedState.overHistory) {
        setOverHistory(savedState.overHistory);
      }

      if (savedState.previousBowlers) {
        setPreviousBowlers(savedState.previousBowlers);
      }
    }

    const savedStatus = JSON.parse(localStorage.getItem(`matchStatus-${matchId}`));
    if (savedStatus) {
      setIsMatchStarted(savedStatus.isMatchStarted ?? false);
      setIsMatchPaused(savedStatus.isMatchPaused ?? false);
      setOverStarted(savedStatus.overStarted ?? false);

      if (savedStatus.isMatchStarted && !savedStatus.isMatchPaused && !savedStatus.overStarted) {
        setOverStarted(true);
        const updatedStatus = { ...savedStatus, overStarted: true };
        localStorage.setItem(`matchStatus-${matchId}`, JSON.stringify(updatedStatus));
      }
    }

    const savedOutPlayers = JSON.parse(localStorage.getItem(`outPlayers-${matchId}`)) || [];
    setOutPlayers(savedOutPlayers);
  }, []);

  useEffect(() => {
    const m = matches.find(m => m._id === matchId);
    if (m) {
      setMatch(m);
      const tossData = JSON.parse(localStorage.getItem(`toss-${matchId}`));
      const playerData = JSON.parse(localStorage.getItem(`players-${matchId}`));

      if (tossData) setToss(tossData);

      if (playerData) {
        const battingTeam = teams.find(t => t._id === tossData?.batFirst);
        const bowlingTeam = teams.find(t => t._id === tossData?.bowlFirst);

        if (battingTeam?.players) {
          setBattingTeamPlayers(battingTeam.players.map(p => p.player));
        }

        if (bowlingTeam?.players) {
          setBowlingTeamPlayers(bowlingTeam.players.map(p => p.player));
        }

        setBatsman1(battingTeam?.players.find(p => p.player._id === playerData.batsman1)?.player);
        setBatsman2(battingTeam?.players.find(p => p.player._id === playerData.batsman2)?.player);
        setBowler(bowlingTeam?.players.find(p => p.player._id === playerData.bowler)?.player);
      }
    }
  }, [matches, teams]);

  useEffect(() => {
    socket.on('matchUpdate', ({ runs, wickets, balls, recentBalls, strike, batsmanStats, bowlerStats, overHistory, previousBowlers }) => {
      setRuns(runs);
      if (wickets !== undefined) setWickets(wickets);
      setBalls(balls);
      setRecentBalls(recentBalls);
      setStrike(strike);
      if (batsmanStats) {
        setBatsmanStats(batsmanStats);
      }
      if (bowlerStats) {
        setBowlerStats(bowlerStats);
      }
      if (overHistory) {
        setOverHistory(overHistory);
      }
      if (previousBowlers) {
        setPreviousBowlers(previousBowlers);
      }
    });
  }, []);

  const persistState = (state) => {
    localStorage.setItem(`score-${matchId}`, JSON.stringify(state));
  };

  const persistMatchStatus = (status) => {
    localStorage.setItem(`matchStatus-${matchId}`, JSON.stringify(status));
  };

  const handleStartPause = () => {
    if (isMatchStarted) {
      const newPaused = !isMatchPaused;
      setIsMatchPaused(newPaused);
      persistMatchStatus({ isMatchStarted, isMatchPaused, overStarted });
    } else {
      setIsMatchStarted(true);
      setIsMatchPaused(false);
      setOverStarted(true);
      persistMatchStatus({ isMatchStarted: true, isMatchPaused: false, overStarted: true });
    }
  };

  const handleSecondInnings = () => {
    // Reset all scoring-related states
    setRuns(0);
    setWickets(0);
    setBalls(0);
    setRecentBalls([]);
    setBallHistory([]);
    setEnhancedBallHistory([]);
    setCurrentOverStats({ runs: 0, wickets: 0, balls: [], legalDeliveries: 0 });
    setOverHistory([]);
    setBowlerStats({});
    setBatsmanStats({
      batsman1: { runs: 0, balls: 0, fours: 0, sixes: 0 },
      batsman2: { runs: 0, balls: 0, fours: 0, sixes: 0 }
    });
    setOutPlayers([]);
    
    // Swap batting and bowling teams
    if (toss) {
      const newToss = {
        ...toss,
        batFirst: toss.bowlFirst,
        bowlFirst: toss.batFirst
      };
      setToss(newToss);
      localStorage.setItem(`toss-${matchId}`, JSON.stringify(newToss));
      
      // Update batting and bowling team players
      const battingTeam = teams.find(t => t._id === newToss.batFirst);
      const bowlingTeam = teams.find(t => t._id === newToss.bowlFirst);
      
      if (battingTeam?.players) {
        setBattingTeamPlayers(battingTeam.players.map(p => p.player));
      }
      
      if (bowlingTeam?.players) {
        setBowlingTeamPlayers(bowlingTeam.players.map(p => p.player));
      }
      
      // Set initial batsmen and bowler
      const playerData = JSON.parse(localStorage.getItem(`players-${matchId}`)) || {};
      if (battingTeam?.players) {
        const firstBatsman = battingTeam.players.find(p => p.player._id === playerData.batsman1)?.player || battingTeam.players[0]?.player;
        const secondBatsman = battingTeam.players.find(p => p.player._id === playerData.batsman2)?.player || battingTeam.players[1]?.player;
        
        setBatsman1(firstBatsman);
        setBatsman2(secondBatsman);
        
        localStorage.setItem(`players-${matchId}`, JSON.stringify({ 
          ...playerData, 
          batsman1: firstBatsman._id,
          batsman2: secondBatsman._id
        }));
      }
      
      if (bowlingTeam?.players) {
        const firstBowler = bowlingTeam.players[0]?.player;
        setBowler(firstBowler);
        
        localStorage.setItem(`players-${matchId}`, JSON.stringify({ 
          ...playerData, 
          bowler: firstBowler._id
        }));
      }
    }
    
    // Update innings number
    setCurrentInnings(2);
    setShowSecondInningsPrompt(false);
    setShowSecondInningsConfirmation(false);
    setIsInningsComplete(false);
    
    // Save state
    persistState({ 
      runs: 0, 
      wickets: 0,
      balls: 0, 
      recentBalls: [], 
      strike: 'batsman1',
      batsmanStats: {
        batsman1: { runs: 0, balls: 0, fours: 0, sixes: 0 },
        batsman2: { runs: 0, balls: 0, fours: 0, sixes: 0 }
      },
      bowlerStats: {},
      overHistory: [],
      previousBowlers: []
    });
    
    // Notify socket
    socket.emit('updateMatch', {
      matchId,
      runs: 0,
      wickets: 0,
      balls: 0,
      recentBalls: [],
      strike: 'batsman1',
      batsmanStats: {
        batsman1: { runs: 0, balls: 0, fours: 0, sixes: 0 },
        batsman2: { runs: 0, balls: 0, fours: 0, sixes: 0 }
      },
      bowlerStats: {},
      overHistory: [],
      previousBowlers: [],
      secondInningsStarted: true
    });
  };

  const handleFinish = async () => {
    const confirmEnd = window.confirm("ARE YOU SURE YOU WANT TO END THE MATCH ??");
    if (!confirmEnd) return;
    
    try {
      // Check if API is available
      const apiAvailable = await isApiAvailable();
      if (!apiAvailable) {
        alert("Warning: API is not available. Match data will be saved locally and synced when the API is available.");
      }
      
      // Save current over if in progress
      if (currentOverStats.balls.length > 0) {
        setOverHistory([...overHistory, currentOverStats]);
      }
      
      // Get match data from localStorage
      const matchResult = JSON.parse(localStorage.getItem(`matchResult-${matchId}`)) || {};
      const matchData = JSON.parse(localStorage.getItem(`match-${matchId}`)) || {};
      const ballByBall = JSON.parse(localStorage.getItem(`ballByBall-${matchId}`)) || [];
      
      // If we don't have a match result yet, create one
      if (!matchResult.matchId) {
        matchResult.matchId = matchId;
        matchResult.firstInningsScore = firstInningsScore;
        matchResult.firstInningsWickets = firstInningsWickets;
        matchResult.firstInningsOvers = firstInningsOvers;
        matchResult.secondInningsScore = runs;
        matchResult.secondInningsWickets = wickets;
        matchResult.secondInningsOvers = balls / 6;
        
        // Determine winner based on scores
        if (currentInnings === 2) {
          if (runs >= runsToWin) {
            matchResult.winningTeam = toss?.batFirst;
            matchResult.result = 'teamB_won';
            matchResult.result = `${teams.find(t => t._id === toss?.batFirst)?.name} won by ${10 - wickets} wickets`;
          } else {
            matchResult.winningTeam = toss?.bowlFirst;
            matchResult.result = 'teamA_won';
            matchResult.result = `${teams.find(t => t._id === toss?.bowlFirst)?.name} won by ${firstInningsScore - runs} runs`;
          }
        } else {
          matchResult.result = 'n/a';
          matchResult.result = "Match ended without a result";
        }
      }
      
     // Prepare complete match data
const completeMatchData = {
  ...matchData,
  ...matchResult,
  ballByBall,
  overHistory,
  status: 'completed',
  completedAt: new Date().toISOString(),
  // Explicitly add these fields to match what the API expects
  firstInningsScore: firstInningsScore,
  secondInningsScore: runs,
  firstInningsWickets: firstInningsWickets,
  secondInningsWickets: wickets,
  firstInningsOvers: firstInningsOvers,
  secondInningsOvers: balls / 6,
  result: matchResult.result, // Make sure this is one of the allowed enum values
  resultDescription: matchResult.resultDescription // This is your human-readable result
};

console.log("Sending match completion data:", completeMatchData);
      
      // Update match in database
      let matchUpdateSuccess = false;
      if (apiAvailable) {
        try {
          const response = await axios.post(`/api/matches/${matchId}/complete`, completeMatchData);
          console.log("Match completion response:", response.data);
          matchUpdateSuccess = true;
        } catch (matchError) {
          console.error("Error updating match in database:", matchError);
          console.error("Error details:", matchError.response?.data || matchError.message);
        }
      }
      
      if (!matchUpdateSuccess) {
        // Store match data in localStorage as fallback
        localStorage.setItem(`completedMatch-${matchId}`, JSON.stringify(completeMatchData));
        console.log("Stored match data in localStorage as fallback");
      }
      
      // Update points table
      const pointsUpdate = {
        matchId,
        teamA: match.teamA,
        teamB: match.teamB,
        winner: matchResult.winningTeam,
        teamAScore: currentInnings === 1 ? runs : firstInningsScore,
        teamBScore: currentInnings === 1 ? 0 : runs,
        teamAOvers: currentInnings === 1 ? (balls / 6) : firstInningsOvers,
        teamBOvers: currentInnings === 1 ? 0 : (balls / 6),
        stage: match.stage
      };
      
      console.log("Sending points update data:", pointsUpdate);
      
      let pointsUpdateSuccess = false;
      if (apiAvailable) {
        try {
          const response = await axios.post(`/api/points/update`, pointsUpdate);
          console.log("Points update response:", response.data);
          pointsUpdateSuccess = true;
        } catch (pointsError) {
          console.error("Error updating points table:", pointsError);
          console.error("Error details:", pointsError.response?.data || pointsError.message);
        }
      }
      
      if (!pointsUpdateSuccess) {
        // Store points data in localStorage as fallback
        localStorage.setItem(`pointsUpdate-${matchId}`, JSON.stringify(pointsUpdate));
        console.log("Stored points data in localStorage as fallback");
      }
      
      // Emit socket events
      socket.emit('matchComplete', completeMatchData);
      socket.emit('pointsTableUpdate', pointsUpdate);
      
      // Clear match state
      setIsMatchStarted(false);
      setIsMatchPaused(false);
      setOverStarted(false);
      setIsMatchComplete(true);
      
      // Clear localStorage for match data
      localStorage.removeItem(`match-${matchId}`);
      localStorage.removeItem(`ballByBall-${matchId}`);
      localStorage.removeItem(`matchResult-${matchId}`);
      
      // Show completion message
      if (matchUpdateSuccess && pointsUpdateSuccess) {
        alert(`Match completed successfully: ${matchResult.result}`);
      } else {
        alert(`Match completed with some issues: ${matchResult.result}\nSome data was saved locally and will be synced when the server is available.`);
      }
      
      // Redirect to matches page
      navigate('/matches');
      
    } catch (error) {
      console.error('Error completing match:', error);
      alert(`Error completing match: ${error.message}`);
    }
  };

  useEffect(() => {
    if (match && isMatchStarted && !isMatchPaused) {
      const isOversComplete = balls >= (match.overs * 6);
      const isAllOut = wickets >= 10;
      
      if ((isOversComplete || isAllOut) && currentInnings === 1 && !isInningsComplete) {
        // Store first innings details
        setFirstInningsScore(runs);
        setFirstInningsWickets(wickets);
        setFirstInningsOvers(balls / 6);
        
        // Calculate runs to win for second innings
        setRunsToWin(runs + 1);
        
        // Mark innings as complete
        setIsInningsComplete(true);
        
        // Show second innings prompt
        setShowSecondInningsPrompt(true);
      }
    }
  }, [balls, wickets, match, isMatchStarted, isMatchPaused, currentInnings, isInningsComplete]);

  const completeOver = () => {
    const completedOver = { 
      ...currentOverStats,
      bowler: bowler?._id,
      bowlerName: bowler?.name 
    };
    const updatedOverHistory = [...overHistory, completedOver];
    setOverHistory(updatedOverHistory);
    
    const updatedPreviousBowlers = [...previousBowlers];
    if (bowler && !updatedPreviousBowlers.includes(bowler._id)) {
      updatedPreviousBowlers.push(bowler._id);
    }
    setPreviousBowlers(updatedPreviousBowlers);
    
    setCurrentOverStats({ runs: 0, wickets: 0, balls: [], legalDeliveries: 0 });
    
    const newStrike = strike === 'batsman1' ? 'batsman2' : 'batsman1';
    setStrike(newStrike);
    
    setIsOverComplete(false);
    setOverStarted(false);
    
    persistState({
      runs,
      wickets,
      balls,
      recentBalls,
      strike: newStrike,
      batsmanStats,
      bowlerStats,
      overHistory: updatedOverHistory,
      previousBowlers: updatedPreviousBowlers
    });
    
    socket.emit('updateMatch', {
      matchId,
      runs,
      wickets,
      balls,
      recentBalls,
      strike: newStrike,
      batsmanStats,
      bowlerStats,
      overHistory: updatedOverHistory,
      previousBowlers: updatedPreviousBowlers,
      overCompleted: true
    });
  };

  const handleNextOver = () => {
    const legalDeliveries = currentOverStats.balls.filter(ball => !['Wd', 'Nb'].includes(ball)).length;
    if (legalDeliveries === 6) {
      completeOver();
      setShowBowlerModal(true);
      setIsOverComplete(false);
      setCurrentOverStats({ runs: 0, wickets: 0, balls: [], legalDeliveries: 0 });
      setUndoCountInOver(0);
    } else {
      alert(`Cannot start next over. Need ${6 - legalDeliveries} more legal deliveries.`);
    }
  };

  const handleBallEvent = (event) => {
    if (isInningsComplete) {
      alert("Innings is complete. Please start the second innings.");
      return;
    }

    const currentLegalDeliveries = currentOverStats.balls.filter(ball => !['Wd', 'Nb'].includes(ball)).length;
    if (currentLegalDeliveries >= 6 && undoCountInOver === 0) {
      alert("Over is complete. Please click Next Over to continue.");
      return;
    }

    if (event === 'W') {
      setDismissedBatsman(strike);
      // Check if this will be the last wicket
      const availableBatsmen = getAvailableBatsmen();
      const willBeLastWicket = wickets >= 9 || availableBatsmen.length === 0;
      setIsLastWicket(willBeLastWicket);
      setShowWicketModal(true);
      return;
    }

    if (isNaN(parseInt(event)) && !['Wd', 'Nb', 'Lb'].includes(event)) return;

    let run = 0;
    let incrementBalls = true;
    let isLegalDelivery = true;
    
    if (event === 'Wd') {
      run = 1;
      incrementBalls = false;
      isLegalDelivery = false;
    } else if (event === 'Nb') {
      run = 1;
      incrementBalls = false;
      isLegalDelivery = false;
    } else if (event === 'Lb') {
      const legByeRuns = parseInt(prompt("How many leg bye runs?", "1"));
      if (!isNaN(legByeRuns) && legByeRuns >= 0) {
        run = legByeRuns;
      }
    } else {
      run = parseInt(event);
    }

    const currentState = { 
      runs, 
      wickets,
      balls, 
      recentBalls: [...recentBalls], 
      strike,
      batsmanStats: { ...batsmanStats },
      bowlerStats: { ...bowlerStats },
      isWicket: false,
      currentBowler: bowler,
      currentBallRuns: run,
      wasLegalDelivery: isLegalDelivery,
      currentOverStats: { ...currentOverStats }
    };
    
    setBallHistory(prev => [currentState, ...prev.slice(0, 9)]);
    setEnhancedBallHistory(prev => [currentState, ...prev.slice(0, 9)]);

    const newRuns = runs + run;
    
    const newBalls = incrementBalls ? balls + 1 : balls;
    
    const updatedCurrentOverStats = {
      ...currentOverStats,
      runs: currentOverStats.runs + run,
      balls: [...currentOverStats.balls, event],
      legalDeliveries: isLegalDelivery ? (currentOverStats.legalDeliveries || 0) + 1 : (currentOverStats.legalDeliveries || 0)
    };

    const newLegalDeliveries = updatedCurrentOverStats.balls.filter(ball => !['Wd', 'Nb'].includes(ball)).length;
    if (newLegalDeliveries === 6) {
      setIsOverComplete(true);
      setOverStarted(false);
    } else {
      setIsOverComplete(false);
    }

    setCurrentOverStats(updatedCurrentOverStats);
    
    const updatedBatsmanStats = { ...batsmanStats };
    if (incrementBalls && !['Wd', 'Nb', 'Lb'].includes(event)) {
      updatedBatsmanStats[strike] = {
        ...updatedBatsmanStats[strike],
        runs: updatedBatsmanStats[strike].runs + run,
        balls: updatedBatsmanStats[strike].balls + 1,
        fours: event === '4' ? updatedBatsmanStats[strike].fours + 1 : updatedBatsmanStats[strike].fours,
        sixes: event === '6' ? updatedBatsmanStats[strike].sixes + 1 : updatedBatsmanStats[strike].sixes
      };
    }
    
    const updatedBowlerStats = { ...bowlerStats };
    if (!updatedBowlerStats[bowler?._id]) {
      updatedBowlerStats[bowler?._id] = { 
        runs: 0, wickets: 0, balls: 0, name: bowler?.name,
        wides: 0, noBalls: 0, maidens: 0 
      };
    }
    
    if (bowler?._id) {
      const bowlerStat = updatedBowlerStats[bowler._id];
      
      if (event === 'Wd') {
        updatedBowlerStats[bowler._id] = {
          ...bowlerStat,
          runs: bowlerStat.runs + run,
          wides: bowlerStat.wides + 1
        };
      } else if (event === 'Nb') {
        updatedBowlerStats[bowler._id] = {
          ...bowlerStat,
          runs: bowlerStat.runs + run,
          noBalls: bowlerStat.noBalls + 1
        };
      } else {
        updatedBowlerStats[bowler._id] = {
          ...bowlerStat,
          runs: bowlerStat.runs + run,
          balls: incrementBalls ? bowlerStat.balls + 1 : bowlerStat.balls
        };
      }
    }
    
    const updatedBalls = [event, ...recentBalls.slice(0, 5)];
    
    let nextStrike = strike;
    if (incrementBalls) {
      if (['Lb'].includes(event)) {
        nextStrike = run % 2 !== 0 ? (strike === 'batsman1' ? 'batsman2' : 'batsman1') : strike;
      } else if (!['Wd', 'Nb'].includes(event)) {
        nextStrike = run % 2 !== 0 ? (strike === 'batsman1' ? 'batsman2' : 'batsman1') : strike;
      }
    }

    setRuns(newRuns);
    setBalls(newBalls);
    setRecentBalls(updatedBalls);
    setStrike(nextStrike);
    setBatsmanStats(updatedBatsmanStats);
    setBowlerStats(updatedBowlerStats);
    
    const stateToSave = { 
      runs: newRuns, 
      wickets,
      balls: newBalls, 
      recentBalls: updatedBalls, 
      strike: nextStrike,
      batsmanStats: updatedBatsmanStats,
      bowlerStats: updatedBowlerStats,
      overHistory,
      previousBowlers
    };
    persistState(stateToSave);

    socket.emit('updateMatch', {
      matchId,
      ...stateToSave
    });

    // Check if second innings target is reached
    if (currentInnings === 2 && newRuns >= runsToWin) {
      // Second innings team has won
      setIsMatchComplete(true);
      setWinningTeam(toss?.batFirst);
      
      // Save match result
      const matchResult = {
        matchId,
        firstInningsScore: firstInningsScore,
        firstInningsWickets: firstInningsWickets,
        firstInningsOvers: firstInningsOvers,
        secondInningsScore: newRuns,
        secondInningsWickets: wickets,
        secondInningsOvers: newBalls / 6,
        result: `${teams.find(t => t._id === toss?.batFirst)?.name} won by ${10 - wickets} wickets`,
        winningTeam: toss?.batFirst
      };
      
      localStorage.setItem(`matchResult-${matchId}`, JSON.stringify(matchResult));
      
      // Notify socket
      socket.emit('matchComplete', matchResult);
      
      // Update match status in the database
      socket.emit('updateMatchStatus', {
        matchId,
        status: 'completed',
        winner: toss?.batFirst,
        result: matchResult.result,
        teamAScore: firstInningsScore,
        teamBScore: newRuns,
        overs: match.overs
      });
      
      // Show match complete alert
      alert(`${teams.find(t => t._id === toss?.batFirst)?.name} won by ${10 - wickets} wickets!`);
    }
    
    // Check if second innings is complete (all out or overs complete)
    if (currentInnings === 2) {
      const isOversComplete = newBalls >= (match.overs * 6);
      const isAllOut = wickets >= 10;
      
      if (isOversComplete || isAllOut) {
        // First innings team has won
        setIsMatchComplete(true);
        setWinningTeam(toss?.bowlFirst);
        
        // Save match result
        const matchResult = {
          matchId,
          firstInningsScore: firstInningsScore,
          firstInningsWickets: firstInningsWickets,
          firstInningsOvers: firstInningsOvers,
          secondInningsScore: newRuns,
          secondInningsWickets: wickets,
          secondInningsOvers: newBalls / 6,
          result: `${teams.find(t => t._id === toss?.bowlFirst)?.name} won by ${firstInningsScore - newRuns} runs`,
          winningTeam: toss?.bowlFirst
        };
        
        localStorage.setItem(`matchResult-${matchId}`, JSON.stringify(matchResult));
        
        // Notify socket
        socket.emit('matchComplete', matchResult);
        
        // Update match status in the database
        socket.emit('updateMatchStatus', {
          matchId,
          status: 'completed',
          winner: toss?.bowlFirst,
          result: matchResult.result,
          teamAScore: firstInningsScore,
          teamBScore: newRuns,
          overs: match.overs
        });
        
        // Show match complete alert
        alert(`${teams.find(t => t._id === toss?.bowlFirst)?.name} won by ${firstInningsScore - newRuns} runs!`);
      }
    }
  };

  const handleUndo = () => {
    if (enhancedBallHistory.length === 0) return;
    
    if (undoCountInOver >= 6) {
      alert("Maximum 6 undos per over allowed");
      return;
    }
    
    const [prevState, ...rest] = enhancedBallHistory;
    
    if (prevState.isWicket) {
      if (prevState.wicketDetails.dismissedPosition === 'batsman1') {
        setBatsman1(prevState.wicketDetails.dismissedPlayer);
      } else {
        setBatsman2(prevState.wicketDetails.dismissedPlayer);
      }
      
      const updatedWickets = wickets - 1;
      setWickets(updatedWickets);
      
      const updatedOutPlayers = outPlayers.filter(
        id => id !== prevState.wicketDetails.dismissedPlayer._id
      );
      setOutPlayers(updatedOutPlayers);
      localStorage.setItem(`outPlayers-${matchId}`, JSON.stringify(updatedOutPlayers));
      
      const wicketsHistory = JSON.parse(localStorage.getItem(`wickets-${matchId}`)) || [];
      const updatedWicketsHistory = wicketsHistory.filter(
        w => w.ballNumber !== prevState.wicketDetails.ballNumber
      );
      localStorage.setItem(`wickets-${matchId}`, JSON.stringify(updatedWicketsHistory));
    }
    
    setEnhancedBallHistory(rest);
    
    const currentBallInOver = balls % 6;
    const isFirstBallOfOver = currentBallInOver === 1;
    const isRestoringPreviousOver = isFirstBallOfOver || currentOverStats.balls.length === 0;
    
    if (isRestoringPreviousOver && overHistory.length > 0) {
      const lastOver = overHistory[overHistory.length - 1];
      
      const previousBowler = bowlingTeamPlayers.find(p => p._id === lastOver.bowler);
      if (previousBowler) {
        setBowler(previousBowler);
      }
      
      const restoredOverStats = {
        runs: lastOver.runs,
        wickets: lastOver.wickets,
        balls: lastOver.balls,
        legalDeliveries: lastOver.balls.filter(ball => !['Wd', 'Nb'].includes(ball)).length
      };
      setCurrentOverStats(restoredOverStats);
      
      const updatedOverHistory = overHistory.slice(0, -1);
      setOverHistory(updatedOverHistory);
      
      setUndoCountInOver(0);
      
      setOverStarted(true);
      setIsOverComplete(false);
    } else {
      setUndoCountInOver(prev => prev + 1);
      
      const updatedCurrentOverStats = {
        ...currentOverStats,
        runs: currentOverStats.runs - (prevState.currentBallRuns || 0),
        balls: currentOverStats.balls.slice(0, -1),
        legalDeliveries: currentOverStats.legalDeliveries - (prevState.wasLegalDelivery ? 1 : 0),
        wickets: currentOverStats.wickets - (prevState.isWicket ? 1 : 0)
      };

      const remainingLegalDeliveries = updatedCurrentOverStats.balls.filter(ball => !['Wd', 'Nb'].includes(ball)).length;
      setIsOverComplete(remainingLegalDeliveries === 6);
      
      setCurrentOverStats(updatedCurrentOverStats);
    }
    
    const updatedBowlerStats = { ...prevState.bowlerStats };
    setBowlerStats(updatedBowlerStats);
    
    setBatsmanStats(prevState.batsmanStats);
    
    setRuns(prevState.runs);
    setWickets(prevState.wickets);
    setBalls(prevState.balls);
    setRecentBalls(prevState.recentBalls);
    setStrike(prevState.strike);
    
    // If we're undoing the last wicket, reset innings complete state
    if (prevState.isWicket && isLastWicket) {
      setIsLastWicket(false);
      setIsInningsComplete(false);
    }
    
    persistState({ 
      runs: prevState.runs, 
      wickets: prevState.wickets,
      balls: prevState.balls, 
      recentBalls: prevState.recentBalls, 
      strike: prevState.strike,
      batsmanStats: prevState.batsmanStats,
      bowlerStats: updatedBowlerStats,
      overHistory: isRestoringPreviousOver ? overHistory.slice(0, -1) : overHistory,
      previousBowlers
    });

    socket.emit('updateMatch', {
      matchId,
      runs: prevState.runs,
      wickets: prevState.wickets,
      balls: prevState.balls,
      recentBalls: prevState.recentBalls,
      strike: prevState.strike,
      batsmanStats: prevState.batsmanStats,
      bowlerStats: updatedBowlerStats,
      overHistory: isRestoringPreviousOver ? overHistory.slice(0, -1) : overHistory,
      undoWicket: prevState.isWicket ? prevState.wicketDetails : null,
      undoOver: isRestoringPreviousOver
    });
  };

  const handleToggleOver = () => {
    const newOverStarted = !overStarted;
    persistMatchStatus({ isMatchStarted, isMatchPaused, overStarted: newOverStarted });
    
    if (newOverStarted === false) {
      if (currentOverStats.balls.length > 0) {
        completeOver();
      }
    }
    
    setTimeout(() => setOverStarted(newOverStarted), 0);
  };

  const handleWicketSubmit = () => {
    const dismissedPlayer = dismissedBatsman === 'batsman1' ? batsman1 : batsman2;
    
    const currentStats = { ...batsmanStats };
    const currentBowlerStats = { ...bowlerStats };

    const currentState = { 
      runs, 
      wickets,
      balls, 
      recentBalls: [...recentBalls], 
      strike,
      batsmanStats: currentStats,
      bowlerStats: currentBowlerStats,
      isWicket: true,
      wicketDetails: {
        dismissedPlayer,
        dismissedPosition: dismissedBatsman,
        wicketType,
        fielder,
        bowler,
        ballNumber: balls + 1
      }
    };
    
    setBallHistory(prev => [currentState, ...prev.slice(0, 9)]);
    setEnhancedBallHistory(prev => [currentState, ...prev.slice(0, 9)]);

    const newWickets = wickets + 1;
    const newBalls = balls + 1;
    
    const updatedBalls = ["W", ...recentBalls.slice(0, 5)];

    // Check if this is the last wicket (10 wickets or no more players available)
    const availableBatsmen = getAvailableBatsmen();
    const isLastWicketNow = newWickets >= 10 || availableBatsmen.length === 0;

    if (isLastWicketNow) {
      // Handle last wicket - end the innings
      setWickets(newWickets);
      setBalls(newBalls);
      setRecentBalls(updatedBalls);
      
      // Update bowler stats
      const updatedBowlerStats = { ...bowlerStats };
      if (bowler?._id) {
        if (!updatedBowlerStats[bowler._id]) {
          updatedBowlerStats[bowler._id] = { 
            runs: 0, wickets: 0, balls: 0, name: bowler?.name,
            wides: 0, noBalls: 0, maidens: 0 
          };
        }
        updatedBowlerStats[bowler._id] = {
          ...updatedBowlerStats[bowler._id],
          wickets: updatedBowlerStats[bowler._id].wickets + 1,
          balls: updatedBowlerStats[bowler._id].balls + 1
        };
      }
      
      // Update current over stats
      const updatedCurrentOverStats = {
        ...currentOverStats,
        wickets: currentOverStats.wickets + 1,
        balls: [...currentOverStats.balls, "W"]
      };
      setCurrentOverStats(updatedCurrentOverStats);
      
      setBowlerStats(updatedBowlerStats);
      
      // Save state
      persistState({ 
        runs, 
        wickets: newWickets,
        balls: newBalls, 
        recentBalls: updatedBalls, 
        strike,
        batsmanStats,
        bowlerStats: updatedBowlerStats,
        overHistory,
        previousBowlers
      });

      // Notify socket
      socket.emit('updateMatch', {
        matchId,
        runs,
        wickets: newWickets,
        balls: newBalls,
        recentBalls: updatedBalls,
        strike,
        batsmanStats,
        bowlerStats: updatedBowlerStats,
        wicket: {
          batsmanId: dismissedPlayer._id,
          batsmanName: dismissedPlayer.name,
          wicketType,
          fielderId: fielder || null,
          fielderName: fielder ? bowlingTeamPlayers.find(p => p._id === fielder)?.name : null,
          bowlerId: bowler?._id,
          bowlerName: bowler?.name,
          ballNumber: balls + 1,
          over: Math.floor(balls / 6) + (balls % 6 === 5 ? 1 : 0)
        }
      });

      // Close modal and reset
      setShowWicketModal(false);
      setWicketType('');
      setFielder('');
      setNextBatsman('');
      setIsLastWicket(false);
      
      // Mark innings as complete
      setIsInningsComplete(true);
      
      // Show second innings prompt
      setShowSecondInningsPrompt(true);
      
      return;
    }

    // For non-last wickets, require next batsman selection
    if (!nextBatsman) {
      alert("Please select the next batsman");
      return;
    }

    // Continue with normal wicket handling for non-last wickets
    const nextBatsmanPlayer = battingTeamPlayers.find(p => p._id === nextBatsman);
    
    // Add dismissed player to out players
    const updatedOutPlayers = [...outPlayers, dismissedPlayer._id];
    setOutPlayers(updatedOutPlayers);
    localStorage.setItem(`outPlayers-${matchId}`, JSON.stringify(updatedOutPlayers));

    // Record wicket details
    const wicketDetails = {
      batsmanId: dismissedPlayer._id,
      batsmanName: dismissedPlayer.name,
      wicketType,
      fielderId: fielder || null,
      fielderName: fielder ? bowlingTeamPlayers.find(p => p._id === fielder)?.name : null,
      bowlerId: bowler?._id,
      bowlerName: bowler?.name,
      ballNumber: balls + 1,
      over: Math.floor(balls / 6) + (balls % 6 === 5 ? 1 : 0)
    };

    const wicketsHistory = JSON.parse(localStorage.getItem(`wickets-${matchId}`)) || [];
    wicketsHistory.push(wicketDetails);
    localStorage.setItem(`wickets-${matchId}`, JSON.stringify(wicketsHistory));

    // Update batsman stats
    const updatedBatsmanStats = { ...batsmanStats };
    
    if (dismissedBatsman === 'batsman1') {
      setBatsman1(nextBatsmanPlayer);
      updatedBatsmanStats.batsman1 = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      const playerData = JSON.parse(localStorage.getItem(`players-${matchId}`)) || {};
      localStorage.setItem(`players-${matchId}`, JSON.stringify({ 
        ...playerData, 
        batsman1: nextBatsmanPlayer._id 
      }));
    } else {
      setBatsman2(nextBatsmanPlayer);
      updatedBatsmanStats.batsman2 = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      const playerData = JSON.parse(localStorage.getItem(`players-${matchId}`)) || {};
      localStorage.setItem(`players-${matchId}`, JSON.stringify({ 
        ...playerData, 
        batsman2: nextBatsmanPlayer._id 
      }));
    }
    
    // Update bowler stats
    const updatedBowlerStats = { ...bowlerStats };
    if (bowler?._id) {
      if (!updatedBowlerStats[bowler._id]) {
        updatedBowlerStats[bowler._id] = { 
          runs: 0, wickets: 0, balls: 0, name: bowler?.name,
          wides: 0, noBalls: 0, maidens: 0 
        };
      }
      updatedBowlerStats[bowler._id] = {
        ...updatedBowlerStats[bowler._id],
        wickets: updatedBowlerStats[bowler._id].wickets + 1,
        balls: updatedBowlerStats[bowler._id].balls + 1
      };
    }
    
    // Update current over stats
    const updatedCurrentOverStats = {
      ...currentOverStats,
      wickets: currentOverStats.wickets + 1,
      balls: [...currentOverStats.balls, "W"]
    };
    setCurrentOverStats(updatedCurrentOverStats);
    
    setBatsmanStats(updatedBatsmanStats);
    setBowlerStats(updatedBowlerStats);

    setWickets(newWickets);
    setBalls(newBalls);
    setRecentBalls(updatedBalls);
    
    // Save state
    persistState({ 
      runs, 
      wickets: newWickets,
      balls: newBalls, 
      recentBalls: updatedBalls, 
      strike,
      batsmanStats: updatedBatsmanStats,
      bowlerStats: updatedBowlerStats,
      overHistory,
      previousBowlers
    });

    // Notify socket
    socket.emit('updateMatch', {
      matchId,
      runs,
      wickets: newWickets,
      balls: newBalls,
      recentBalls: updatedBalls,
      strike,
      batsmanStats: updatedBatsmanStats,
      bowlerStats: updatedBowlerStats,
      wicket: wicketDetails
    });

    // Close modal and reset
    setShowWicketModal(false);
    setWicketType('');
    setFielder('');
    setNextBatsman('');
    
    // Check if over is complete
    if (newBalls % 6 === 0) {
      completeOver();
    }
  };
  
  const handleBowlerSelection = () => {
    if (!selectedBowler) {
      alert("Please select a bowler");
      return;
    }
    
    if (bowler?._id === selectedBowler) {
      alert("Same bowler cannot bowl consecutive overs");
      return;
    }
    
    const newBowler = bowlingTeamPlayers.find(p => p._id === selectedBowler);
    setBowler(newBowler);
    
    const updatedBowlerStats = { ...bowlerStats };
    if (!updatedBowlerStats[selectedBowler]) {
      updatedBowlerStats[selectedBowler] = { 
        runs: 0, wickets: 0, balls: 0, name: newBowler?.name,
        wides: 0, noBalls: 0, maidens: 0 
      };
      setBowlerStats(updatedBowlerStats);
    }
    
    setUndoCountInOver(0);
    
    const playerData = JSON.parse(localStorage.getItem(`players-${matchId}`)) || {};
    localStorage.setItem(`players-${matchId}`, JSON.stringify({ 
      ...playerData, 
      bowler: selectedBowler
    }));
    
    setOverStarted(true);
    setIsOverComplete(false);
    persistMatchStatus({ isMatchStarted, isMatchPaused, overStarted: true });
    
    setShowBowlerModal(false);
    setSelectedBowler('');
  };

    const handleChangeBatsmen = () => {
      const newStrike = strike === 'batsman1' ? 'batsman2' : 'batsman1';
      setStrike(newStrike);
      
      const stateToSave = { 
        runs, 
        wickets,
        balls, 
        recentBalls, 
        strike: newStrike,
        batsmanStats,
        bowlerStats,
        overHistory,
        previousBowlers
      };
      persistState(stateToSave);
      
      socket.emit('updateMatch', {
        matchId,
        ...stateToSave
      });
    };
  
    const getAvailableBatsmen = () => {
      if (!battingTeamPlayers) return [];
      return battingTeamPlayers.filter(player => 
        !outPlayers.includes(player._id) && 
        player._id !== batsman1?._id && 
        player._id !== batsman2?._id
      );
    };
  
    const getAvailableBowlers = () => {
      if (!bowlingTeamPlayers) return [];
      
      if (bowler && bowlingTeamPlayers.length > 1) {
        return bowlingTeamPlayers.filter(player => player._id !== bowler._id);
      }
      return bowlingTeamPlayers;
    };
  
    const wicketTypeOptions = [
      { value: 'bowled', label: 'Bowled' },
      { value: 'caught', label: 'Caught' },
      { value: 'lbw', label: 'LBW' },
      { value: 'run_out', label: 'Run Out' },
      { value: 'stumped', label: 'Stumped' },
      { value: 'hit_wicket', label: 'Hit Wicket' },
    ];
  
    const needsFielder = ['caught', 'run_out', 'stumped'].includes(wicketType);
  
    const formatOvers = () => {
      const completeOvers = Math.floor(balls / 6);
      const remainingBalls = balls % 6;
      return `${completeOvers}.${remainingBalls}`;
    };
  
    const battingTeamName = teams.find(t => t._id === toss?.batFirst)?.name;
    const overs = formatOvers();
    const runRate = balls > 0 ? (runs / (balls / 6)).toFixed(2) : '0.00';
  
    return (
      <div className="px-4 py-2 space-y-4 w-full max-w-md mx-auto min-h-screen bg-gray-50">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-indigo-700">Live Scoring</h2>
          <div className="flex gap-2">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow" onClick={handleStartPause}>{isMatchPaused ? 'Resume' : isMatchStarted ? 'Pause' : 'Start Match'}</button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow" onClick={handleFinish}>End Match</button>
          </div>
        </div>
  
        {match && (
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-4 shadow-md">
            <p className="text-lg font-bold text-indigo-900">{match.teamA.name} vs {match.teamB.name}</p>
            <p className="text-sm text-gray-700">{new Date(match.date).toLocaleString()}</p>
            {toss && (
              <p className="text-xs text-blue-700 mt-1">{teams.find(t => t._id === toss.tossWinner)?.name} won the toss and elected to bat</p>
            )}
            <p className="text-xs text-indigo-700 mt-1">Overs: {match?.overs || 'N/A'}</p>
            <p className="text-xs font-semibold text-green-700 mt-1">
              {currentInnings === 1 ? '1st Innings' : '2nd Innings'} 
              {isInningsComplete && currentInnings === 1 && ' (Completed)'}
            </p>
            {currentInnings === 2 && (
              <p className="text-xs font-semibold text-red-700 mt-1">
                Target: {runsToWin} runs ({runsToWin - runs} runs needed)
              </p>
            )}
            {currentInnings === 1 && (
              <div className="mt-3">
                <button 
                  onClick={() => {
                    // Check if first innings is complete (all overs bowled or all wickets fallen)
                    const isOversComplete = balls >= (match.overs * 6);
                    const isAllOut = wickets >= 10;
                    
                    if (!isOversComplete && !isAllOut) {
                      alert("Cannot start 2nd innings. First innings must be completed (all overs bowled or all wickets fallen).");
                      return;
                    }
                    
                    setShowSecondInningsConfirmation(true);
                  }}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md w-full text-sm font-semibold transition-colors duration-200 ${
                    (!isInningsComplete) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!isInningsComplete}
                >
                  Start 2nd Inning
                </button>
                {!isInningsComplete && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Complete first innings to enable second innings
                  </p>
                )}
              </div>
            )}
            {isMatchComplete && (
              <div className="mt-2 p-2 bg-green-100 rounded-lg">
                <p className="text-sm font-bold text-green-800 text-center">
                  {teams.find(t => t._id === winningTeam)?.name} won the match!
                </p>
              </div>
            )}
          </div>
        )}
  
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-800">Batsmen</h3>
            <div className="text-right">
              <p className="text-sm font-bold text-indigo-600">{battingTeamName}</p>
              <p className="text-lg font-semibold">{runs}/{wickets}</p>
              <p className="text-xs text-gray-600">Overs: {overs} | RR: {runRate}</p>
            </div>
          </div>
          {batsman1 && (
            <p className="text-sm text-gray-700">
              🟢 {batsman1.name} {strike === 'batsman1' ? '*' : ''} {batsmanStats.batsman1.runs}({batsmanStats.batsman1.balls})
              {batsmanStats.batsman1.fours > 0 && ` 4s: ${batsmanStats.batsman1.fours}`}
              {batsmanStats.batsman1.sixes > 0 && ` 6s: ${batsmanStats.batsman1.sixes}`}
            </p>
          )}
          {batsman2 && (
            <p className="text-sm text-gray-700">
              ⚪ {batsman2.name} {strike === 'batsman2' ? '*' : ''} {batsmanStats.batsman2.runs}({batsmanStats.batsman2.balls})
              {batsmanStats.batsman2.fours > 0 && ` 4s: ${batsmanStats.batsman2.fours}`}
              {batsmanStats.batsman2.sixes > 0 && ` 6s: ${batsmanStats.batsman2.sixes}`}
            </p>
          )}
          <button onClick={handleChangeBatsmen} className="text-indigo-500 text-xs mt-1">🔄 Swap Strike</button>
        </div>
  
        <div className="bg-white rounded-xl p-4 shadow-md">
          <h3 className="text-base font-semibold text-gray-800 mb-2">Current Bowler</h3>
          {bowler && (
            <p className="text-sm text-gray-700">
              🎯 {bowler.name}
              {bowlerStats[bowler._id] && (
                <span className="ml-2">
                  {bowlerStats[bowler._id].wickets}/{bowlerStats[bowler._id].runs} 
                  ({Math.floor(bowlerStats[bowler._id].balls / 6)}.{bowlerStats[bowler._id].balls % 6} overs)
                </span>
              )}
            </p>
          )}
        </div>
  
        {(isMatchStarted && !isMatchPaused) && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <button 
                onClick={handleToggleOver}
                className={`px-4 py-2 rounded-full shadow ${overStarted ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                {overStarted ? 'End Over' : 'Start Over'}
              </button>
            </div>
            
            {overStarted && (
              <>
                <div className="grid grid-cols-5 gap-3">
                  {[{ val: '0', label: 'Dot' }, { val: '1', label: 'Single' }, { val: '2', label: 'Double' },
                    { val: '3', label: 'Triple' }, { val: '4', label: 'Four', className: 'bg-blue-100 text-blue-800' }
                  ].map(({ val, label, className }) => (
                    <button
                      key={val}
                      onClick={() => handleBallEvent(val)}
                      className={`flex flex-col items-center justify-center border rounded-lg p-2 font-semibold shadow ${className || 'bg-white text-black'}`}
                    >
                      <span className="text-xl">{val}</span>
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
            
                <div className="grid grid-cols-5 gap-3">
                  {[{ val: '6', label: 'Six', className: 'bg-blue-100 text-blue-800' },
                    { val: 'W', label: 'Wicket', className: 'bg-red-100 text-red-700' },
                    { val: 'Wd', label: 'Wide', className: 'bg-yellow-100 text-yellow-700' },
                    { val: 'Nb', label: 'No Ball', className: 'bg-yellow-100 text-yellow-700' },
                    { val: 'Lb', label: 'Leg By', className: 'bg-yellow-100 text-yellow-700' }
                  ].map(({ val, label, className }) => (
                    <button
                      key={val}
                      onClick={() => handleBallEvent(val)}
                      className={`flex flex-col items-center justify-center border rounded-lg p-2 font-semibold shadow ${className}`}
                    >
                      <span className="text-xl">{val}</span>
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={handleUndo} 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-full shadow"
                  >
                    ↩️ Undo Last Ball
                  </button>
                  
                  <button 
                    onClick={handleNextOver}
                    disabled={!isOverComplete || !isAdmin}
                    className={`px-4 py-2 rounded-full shadow ${
                      isOverComplete && isAdmin
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                    title={!isOverComplete ? "Over not complete yet" : !isAdmin ? "Only admin can start next over" : "Start next over"}
                  >
                    Next Over
                  </button>
                </div>
              </>
            )}
          </div>
        )}
  
        <div className="bg-white rounded-xl p-4 shadow-md">
          <h3 className="text-base font-semibold text-gray-800 mb-2">Recent Balls</h3>
          <div className="flex gap-2 flex-wrap">
            {recentBalls.map((ball, idx) => (
              <span key={idx} className={`px-3 py-1 rounded-full text-sm shadow-sm ${
                ball === 'W' ? 'bg-red-100 text-red-800' :
                ball === '4' || ball === '6' ? 'bg-blue-100 text-blue-800' :
                ball === 'Wd' || ball === 'Nb' || ball === 'Lb' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-200 text-gray-800'
              }`}>{ball}</span>
            ))}
          </div>
        </div>
  
        {overStarted && currentOverStats.balls.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-md">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Current Over</h3>
            <div className="flex justify-between items-center">
              <div className="flex gap-2 flex-wrap">
                {currentOverStats.balls.map((ball, idx) => (
                  <span key={idx} className={`px-3 py-1 rounded-full text-sm shadow-sm ${
                    ball === 'W' ? 'bg-red-100 text-red-800' :
                    ball === '4' || ball === '6' ? 'bg-blue-100 text-blue-800' :
                    ball === 'Wd' || ball === 'Nb' || ball === 'Lb' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>{ball}</span>
                ))}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{currentOverStats.runs} runs</p>
                <p className="text-xs text-gray-600">{currentOverStats.wickets} wicket(s)</p>
              </div>
            </div>
          </div>
        )}
  
        {overHistory.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-md">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Over History</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {overHistory.map((over, idx) => (
                <div key={idx} className="border-b pb-1 flex justify-between">
                  <div>
                    <p className="text-xs font-medium">Over {idx + 1}: {over.bowlerName}</p>
                    <div className="flex gap-1 mt-1">
                      {over.balls.map((ball, ballIdx) => (
                        <span key={ballIdx} className={`px-2 py-0.5 rounded text-xs ${
                          ball === 'W' ? 'bg-red-100 text-red-800' :
                          ball === '4' || ball === '6' ? 'bg-blue-100 text-blue-800' :
                          ball === 'Wd' || ball === 'Nb' || ball === 'Lb' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>{ball}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{over.runs} runs</p>
                    <p className="text-xs text-gray-600">{over.wickets} wicket(s)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
  
        {Object.keys(bowlerStats).length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-md">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Bowlers Summary</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left py-1">Bowler</th>
                    <th className="text-center py-1">O</th>
                    <th className="text-center py-1">R</th>
                    <th className="text-center py-1">W</th>
                    <th className="text-center py-1">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(bowlerStats).map(([bowlerId, stats]) => (
                    <tr key={bowlerId} className="border-b">
                      <td className="py-1">{stats.name}</td>
                      <td className="text-center py-1">{Math.floor(stats.balls / 6)}.{stats.balls % 6}</td>
                      <td className="text-center py-1">{stats.runs}</td>
                      <td className="text-center py-1">{stats.wickets}</td>
                      <td className="text-center py-1">
                        {stats.balls > 0 ? (stats.runs / (stats.balls / 6)).toFixed(1) : '0.0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
  
        {showWicketModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl w-11/12 max-w-md">
              <h3 className="text-lg font-bold text-red-700 mb-4">Wicket Fallen!</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Dismissal Type
                </label>
                <select 
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={wicketType}
                  onChange={e => setWicketType(e.target.value)}
                >
                  <option value="">Select dismissal type</option>
                  {wicketTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {needsFielder && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {wicketType === 'caught' ? 'Caught by' : wicketType === 'run_out' ? 'Run out by' : 'Stumped by'}
                  </label>
                  <select 
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={fielder}
                    onChange={e => setFielder(e.target.value)}
                  >
                    <option value="">Select fielder</option>
                    {bowlingTeamPlayers.map(player => (
                      <option key={player._id} value={player._id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Only show next batsman selection if it's not the last wicket */}
              {!isLastWicket && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Next Batsman
                </label>
                <select 
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={nextBatsman}
                  onChange={e => setNextBatsman(e.target.value)}
                >
                  <option value="">Select next batsman</option>
                  {getAvailableBatsmen().map(player => (
                    <option key={player._id} value={player._id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
              )}
              
              <div className="flex justify-between">
                <button 
                  onClick={() => setShowWicketModal(false)} 
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleWicketSubmit}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                  disabled={!wicketType || (needsFielder && !fielder) || (!isLastWicket && !nextBatsman)}
                >
                  Confirm Wicket
                </button>
              </div>
            </div>
          </div>
        )}
  
        {showBowlerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl w-11/12 max-w-md">
              <h3 className="text-lg font-bold text-blue-700 mb-4">Select Next Bowler</h3>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Bowler for next over
                </label>
                <select 
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={selectedBowler}
                  onChange={e => setSelectedBowler(e.target.value)}
                >
                  <option value="">Select bowler</option>
                  {getAvailableBowlers().map(player => (
                    <option key={player._id} value={player._id}>
                      {player.name}
                      {bowlerStats[player._id] ? 
                        ` (${bowlerStats[player._id].wickets}/${bowlerStats[player._id].runs}, ${Math.floor(bowlerStats[player._id].balls / 6)}.${bowlerStats[player._id].balls % 6} overs)` 
                        : ''}
                    </option>
                  ))}
                </select>
                {bowler && (
                  <p className="text-xs mt-2 text-red-600">
                    Note: As per cricket rules, {bowler.name} cannot bowl consecutive overs.
                  </p>
                )}
              </div>
              
              <div className="flex justify-between">
                <button 
                  onClick={() => {
                    setShowBowlerModal(false);
                    setIsMatchPaused(true);
                    persistMatchStatus({ isMatchStarted: true, isMatchPaused: true, overStarted: false });
                  }} 
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                >
                  Pause Match
                </button>
                <button 
                  onClick={handleBowlerSelection}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                  disabled={!selectedBowler}
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}
  
        {showSecondInningsPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl w-11/12 max-w-md">
              <h3 className="text-lg font-bold text-blue-700 mb-4">First Innings Complete!</h3>
              <p className="text-gray-700 mb-6">
                {teams.find(t => t._id === toss?.batFirst)?.name} scored {runs}/{wickets} in {formatOvers()} overs.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowSecondInningsPrompt(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-full shadow"
                >
                  Close
                </button>
                <button
                  onClick={() => setShowSecondInningsConfirmation(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow"
                >
                  Start Second Innings
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showSecondInningsConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl w-11/12 max-w-md">
              <h3 className="text-lg font-bold text-blue-700 mb-4">Start Second Innings?</h3>
              <p className="text-gray-700 mb-2">
                {teams.find(t => t._id === toss?.bowlFirst)?.name} needs {runsToWin} runs to win.
              </p>
              <p className="text-gray-700 mb-6">
                Are you sure you want to start the second innings?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowSecondInningsConfirmation(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-full shadow"
                >
                  No
                </button>
                <button
                  onClick={handleSecondInnings}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default LiveScoringPanel;