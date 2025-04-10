import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useMatchStore from '../../store/useMatchStore';
import useTeamStore from '../../store/useTeamStore';
import socket from '../../utils/socket';

const LiveScoringPanel = () => {
  const { matchId } = useParams();
  const { matches, fetchMatches } = useMatchStore();
  const { teams, fetchTeams } = useTeamStore();

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
  const [wickets, setWickets] = useState(0); // NEW: Track wickets count
  const [balls, setBalls] = useState(0);
  const [strike, setStrike] = useState('batsman1');
  const [ballHistory, setBallHistory] = useState([]);
  // Enhanced ball history to include wicket details
  const [enhancedBallHistory, setEnhancedBallHistory] = useState([]);
  // Wicket handling states
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState('');
  const [fielder, setFielder] = useState('');
  const [nextBatsman, setNextBatsman] = useState('');
  const [dismissedBatsman, setDismissedBatsman] = useState('');
  const [battingTeamPlayers, setBattingTeamPlayers] = useState([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState([]);
  const [outPlayers, setOutPlayers] = useState([]);
  // NEW: Bowler selection modal
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [selectedBowler, setSelectedBowler] = useState('');
  const [previousBowlers, setPreviousBowlers] = useState([]); // Track bowlers to enforce consecutive over rule
  // NEW: Over statistics
  const [currentOverStats, setCurrentOverStats] = useState({ runs: 0, wickets: 0, balls: [], legalDeliveries: 0 });
  const [overHistory, setOverHistory] = useState([]);
  // NEW: Bowler statistics
  const [bowlerStats, setBowlerStats] = useState({});
  
  // Individual stats for each batsman
  const [batsmanStats, setBatsmanStats] = useState({
    batsman1: { runs: 0, balls: 0, fours: 0, sixes: 0 },
    batsman2: { runs: 0, balls: 0, fours: 0, sixes: 0 }
  });

  const [showNextOverButton, setShowNextOverButton] = useState(false);
  const [isOverComplete, setIsOverComplete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true); // Assuming the current user is admin
  // Add new state to track undo count per over
  const [undoCountInOver, setUndoCountInOver] = useState(0);

  useEffect(() => {
    fetchMatches();
    fetchTeams();
    socket.emit('joinMatch', matchId);

    const savedState = JSON.parse(localStorage.getItem(`score-${matchId}`));
    if (savedState) {
      setRuns(savedState.runs || 0);
      setWickets(savedState.wickets || 0); // NEW: Load wickets
      setBalls(savedState.balls || 0);
      setRecentBalls(savedState.recentBalls || []);
      setStrike(savedState.strike || 'batsman1');
      
      // Load batsman stats if available
      if (savedState.batsmanStats) {
        setBatsmanStats(savedState.batsmanStats);
      }

      // Load bowler stats if available
      if (savedState.bowlerStats) {
        setBowlerStats(savedState.bowlerStats);
      }

      // Load over history
      if (savedState.overHistory) {
        setOverHistory(savedState.overHistory);
      }

      // Load previous bowlers
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

    // Load out players
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
      persistMatchStatus({ isMatchStarted: true, isMatchPaused: newPaused, overStarted });
    } else {
      // When starting the match, automatically start the over too
      setIsMatchStarted(true);
      setIsMatchPaused(false);
      setOverStarted(true); // Auto-start the over when starting the match
      persistMatchStatus({ isMatchStarted: true, isMatchPaused: false, overStarted: true });
    }
  };

  const handleFinish = () => {
    const confirmEnd = window.confirm("ARE YOU SURE YOU WANT TO END THE MATCH ??");
    if (!confirmEnd) return;
    
    // If there's an incomplete over, add it to the over history
    if (currentOverStats.balls.length > 0) {
      setOverHistory([...overHistory, currentOverStats]);
    }
    
    setIsMatchStarted(false);
    setIsMatchPaused(false);
    setOverStarted(false);
    persistMatchStatus({ isMatchStarted: false, isMatchPaused: false, overStarted: false });
  };

  // NEW: Handle end of over and bowler change
  const completeOver = () => {
    // Add current over to history
    const completedOver = { 
      ...currentOverStats,
      bowler: bowler?._id,
      bowlerName: bowler?.name 
    };
    const updatedOverHistory = [...overHistory, completedOver];
    setOverHistory(updatedOverHistory);
    
    // Update previous bowlers (for enforcing cricket rules)
    const updatedPreviousBowlers = [...previousBowlers];
    if (bowler && !updatedPreviousBowlers.includes(bowler._id)) {
      updatedPreviousBowlers.push(bowler._id);
    }
    setPreviousBowlers(updatedPreviousBowlers);
    
    // Reset current over stats
    setCurrentOverStats({ runs: 0, wickets: 0, balls: [], legalDeliveries: 0 });
    
    // Swap strike (end of over rule)
    const newStrike = strike === 'batsman1' ? 'batsman2' : 'batsman1';
    setStrike(newStrike);
    
    // Reset over status
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

  // Modify handleNextOver to check legal deliveries properly
  const handleNextOver = () => {
    const legalDeliveries = currentOverStats.balls.filter(ball => !['Wd', 'Nb'].includes(ball)).length;
    if (legalDeliveries === 6) {
      completeOver();
      setShowBowlerModal(true);
      setIsOverComplete(false);
      setCurrentOverStats({ runs: 0, wickets: 0, balls: [], legalDeliveries: 0 });
      setUndoCountInOver(0); // Reset undo count for new over
    } else {
      alert(`Cannot start next over. Need ${6 - legalDeliveries} more legal deliveries.`);
    }
  };

  const handleBallEvent = (event) => {
    // Check if we have 6 legal deliveries in the current over
    const currentLegalDeliveries = currentOverStats.balls.filter(ball => !['Wd', 'Nb'].includes(ball)).length;
    if (currentLegalDeliveries >= 6 && undoCountInOver === 0) {
      alert("Over is complete. Please click Next Over to continue.");
      return;
    }

    if (event === 'W') {
      setDismissedBatsman(strike);
      setShowWicketModal(true);
      return;
    }

    // Skip if the event is not a number or one of the special cases
    if (isNaN(parseInt(event)) && !['Wd', 'Nb', 'Lb'].includes(event)) return;

    let run = 0;
    let incrementBalls = true;
    let isLegalDelivery = true;
    
    // Handle different ball types
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

    // Store current state for history with additional details
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
    
    // Add to history
    setBallHistory(prev => [currentState, ...prev.slice(0, 9)]);
    setEnhancedBallHistory(prev => [currentState, ...prev.slice(0, 9)]);

    // Update total runs
    const newRuns = runs + run;
    
    // Update balls count if applicable
    const newBalls = incrementBalls ? balls + 1 : balls;
    
    // Update current over stats
    const updatedCurrentOverStats = {
      ...currentOverStats,
      runs: currentOverStats.runs + run,
      balls: [...currentOverStats.balls, event],
      legalDeliveries: isLegalDelivery ? (currentOverStats.legalDeliveries || 0) + 1 : (currentOverStats.legalDeliveries || 0)
    };

    // Check if over is complete (6 legal deliveries)
    const newLegalDeliveries = updatedCurrentOverStats.balls.filter(ball => !['Wd', 'Nb'].includes(ball)).length;
    if (newLegalDeliveries === 6) {
      setIsOverComplete(true);
      setOverStarted(false); // Stop the over when 6 legal deliveries are bowled
    } else {
      setIsOverComplete(false);
    }

    setCurrentOverStats(updatedCurrentOverStats);
    
    // Update batsman stats if it's a counting ball and not extras
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
    
    // Update bowler stats
    const updatedBowlerStats = { ...bowlerStats };
    if (!updatedBowlerStats[bowler?._id]) {
      updatedBowlerStats[bowler?._id] = { 
        runs: 0, wickets: 0, balls: 0, name: bowler?.name,
        wides: 0, noBalls: 0, maidens: 0 
      };
    }
    
    // Update current bowler's stats
    if (bowler?._id) {
      const bowlerStat = updatedBowlerStats[bowler._id];
      
      // Update based on ball type
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
    
    // Determine new strike position based on run count
    // For regular deliveries, strike changes if odd runs
    // For special deliveries (Wd, Nb, Lb), handle separately
    let nextStrike = strike;
    if (incrementBalls) {
      if (['Lb'].includes(event)) {
        // For leg byes, strike changes on odd runs
        nextStrike = run % 2 !== 0 ? (strike === 'batsman1' ? 'batsman2' : 'batsman1') : strike;
      } else if (!['Wd', 'Nb'].includes(event)) {
        // For regular runs, strike changes on odd runs
        nextStrike = run % 2 !== 0 ? (strike === 'batsman1' ? 'batsman2' : 'batsman1') : strike;
      }
    }

    // Update all state
    setRuns(newRuns);
    setBalls(newBalls);
    setRecentBalls(updatedBalls);
    setStrike(nextStrike);
    setBatsmanStats(updatedBatsmanStats);
    setBowlerStats(updatedBowlerStats);
    
    // Save to localStorage
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

    // Send update via socket
    socket.emit('updateMatch', {
      matchId,
      ...stateToSave
    });
  };

  const handleUndo = () => {
    if (enhancedBallHistory.length === 0) return;
    
    // Check if we've reached the undo limit for this over
    if (undoCountInOver >= 6) {
      alert("Maximum 6 undos per over allowed");
      return;
    }
    
    const [prevState, ...rest] = enhancedBallHistory;
    
    // Check if we're undoing a wicket
    if (prevState.isWicket) {
      // Restore dismissed batsman
      if (prevState.wicketDetails.dismissedPosition === 'batsman1') {
        setBatsman1(prevState.wicketDetails.dismissedPlayer);
      } else {
        setBatsman2(prevState.wicketDetails.dismissedPlayer);
      }
      
      // Reduce wickets count
      const updatedWickets = wickets - 1;
      setWickets(updatedWickets);
      
      // Remove player from out players list
      const updatedOutPlayers = outPlayers.filter(
        id => id !== prevState.wicketDetails.dismissedPlayer._id
      );
      setOutPlayers(updatedOutPlayers);
      localStorage.setItem(`outPlayers-${matchId}`, JSON.stringify(updatedOutPlayers));
      
      // Remove the wicket from wicket history in localStorage
      const wicketsHistory = JSON.parse(localStorage.getItem(`wickets-${matchId}`)) || [];
      const updatedWicketsHistory = wicketsHistory.filter(
        w => w.ballNumber !== prevState.wicketDetails.ballNumber
      );
      localStorage.setItem(`wickets-${matchId}`, JSON.stringify(updatedWicketsHistory));
    }
    
    // Update enhanced ball history
    setEnhancedBallHistory(rest);
    
    // Check if we need to restore the previous over
    const currentBallInOver = balls % 6;
    const isFirstBallOfOver = currentBallInOver === 1;
    const isRestoringPreviousOver = isFirstBallOfOver || currentOverStats.balls.length === 0;
    
    if (isRestoringPreviousOver && overHistory.length > 0) {
      // Get the last completed over
      const lastOver = overHistory[overHistory.length - 1];
      
      // Restore the previous bowler
      const previousBowler = bowlingTeamPlayers.find(p => p._id === lastOver.bowler);
      if (previousBowler) {
        setBowler(previousBowler);
      }
      
      // Update current over stats with the last over's stats
      const restoredOverStats = {
        runs: lastOver.runs,
        wickets: lastOver.wickets,
        balls: lastOver.balls,
        legalDeliveries: lastOver.balls.filter(ball => !['Wd', 'Nb'].includes(ball)).length
      };
      setCurrentOverStats(restoredOverStats);
      
      // Remove the last over from history
      const updatedOverHistory = overHistory.slice(0, -1);
      setOverHistory(updatedOverHistory);
      
      // Reset undo count for new over
      setUndoCountInOver(0);
      
      // Set over as started since we're restoring a previous over
      setOverStarted(true);
      setIsOverComplete(false);
    } else {
      // Increment undo count for current over
      setUndoCountInOver(prev => prev + 1);
      
      // Update current over stats by removing the last ball
      const updatedCurrentOverStats = {
        ...currentOverStats,
        runs: currentOverStats.runs - (prevState.currentBallRuns || 0),
        balls: currentOverStats.balls.slice(0, -1),
        legalDeliveries: currentOverStats.legalDeliveries - (prevState.wasLegalDelivery ? 1 : 0),
        wickets: currentOverStats.wickets - (prevState.isWicket ? 1 : 0)
      };

      // Check if the over is still complete after undo
      const remainingLegalDeliveries = updatedCurrentOverStats.balls.filter(ball => !['Wd', 'Nb'].includes(ball)).length;
      setIsOverComplete(remainingLegalDeliveries === 6);
      
      setCurrentOverStats(updatedCurrentOverStats);
    }
    
    // Update bowler stats
    const updatedBowlerStats = { ...prevState.bowlerStats };
    setBowlerStats(updatedBowlerStats);
    
    // Update batsman stats
    setBatsmanStats(prevState.batsmanStats);
    
    // Restore previous state values
    setRuns(prevState.runs);
    setWickets(prevState.wickets);
    setBalls(prevState.balls);
    setRecentBalls(prevState.recentBalls);
    setStrike(prevState.strike);
    
    // Save to localStorage
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

    // Update via socket
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
      // If ending the over manually, check if we have any balls
      if (currentOverStats.balls.length > 0) {
        completeOver();
      }
    }
    
    setTimeout(() => setOverStarted(newOverStarted), 0);
  };

  const handleWicketSubmit = () => {
    if (!nextBatsman) {
      alert("Please select the next batsman");
      return;
    }

    // Prepare dismissedPlayer info
    const dismissedPlayer = dismissedBatsman === 'batsman1' ? batsman1 : batsman2;
    
    // Store batsman stats before wicket for history
    const currentStats = { ...batsmanStats };
    const currentBowlerStats = { ...bowlerStats };

    // Current state for history - with wicket details for potential undo
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
    
    // Add to both history trackers
    setBallHistory(prev => [currentState, ...prev.slice(0, 9)]);
    setEnhancedBallHistory(prev => [currentState, ...prev.slice(0, 9)]);

    // Update wickets count and ball count
    const newWickets = wickets + 1;
    const newBalls = balls + 1;
    
    // Use simple "W" for wicket in recent balls display
    const updatedBalls = ["W", ...recentBalls.slice(0, 5)];

    // Update batsmen
    const nextBatsmanPlayer = battingTeamPlayers.find(p => p._id === nextBatsman);
    
    // Add dismissed player to out players
    const updatedOutPlayers = [...outPlayers, dismissedPlayer._id];
    setOutPlayers(updatedOutPlayers);
    localStorage.setItem(`outPlayers-${matchId}`, JSON.stringify(updatedOutPlayers));

    // Record wicket details (but don't display in recent balls)
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

    // Reset stats for the new batsman
    const updatedBatsmanStats = { ...batsmanStats };
    
    // Replace dismissed batsman and reset their stats
    if (dismissedBatsman === 'batsman1') {
      setBatsman1(nextBatsmanPlayer);
      // Reset stats for the new batsman
      updatedBatsmanStats.batsman1 = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      // Update player data in localStorage
      const playerData = JSON.parse(localStorage.getItem(`players-${matchId}`)) || {};
      localStorage.setItem(`players-${matchId}`, JSON.stringify({ 
        ...playerData, 
        batsman1: nextBatsmanPlayer._id 
      }));
    } else {
      setBatsman2(nextBatsmanPlayer);
      // Reset stats for the new batsman
      updatedBatsmanStats.batsman2 = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      // Update player data in localStorage
      const playerData = JSON.parse(localStorage.getItem(`players-${matchId}`)) || {};
      localStorage.setItem(`players-${matchId}`, JSON.stringify({ 
        ...playerData, 
        batsman2: nextBatsmanPlayer._id 
      }));
    }
    
    // Update bowler wicket stats
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
    
    // Update batsman stats state
    setBatsmanStats(updatedBatsmanStats);
    setBowlerStats(updatedBowlerStats);

    // Update wickets and ball count state
    setWickets(newWickets);
    setBalls(newBalls);
    setRecentBalls(updatedBalls);
    
    // Save all to localStorage
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
    
    // Check if over is complete (6 legal deliveries)
    if (newBalls % 6 === 0) {
      completeOver();
    }
  };
  
  // NEW: Handle bowler selection at the end of an over
  const handleBowlerSelection = () => {
    if (!selectedBowler) {
      alert("Please select a bowler");
      return;
    }
    
    // Cricket rules: A bowler cannot bowl two consecutive overs
    if (bowler?._id === selectedBowler) {
      alert("Same bowler cannot bowl consecutive overs");
      return;
    }
    
    const newBowler = bowlingTeamPlayers.find(p => p._id === selectedBowler);
    setBowler(newBowler);
    
    // Initialize stats for this bowler if not already done
    const updatedBowlerStats = { ...bowlerStats };
    if (!updatedBowlerStats[selectedBowler]) {
      updatedBowlerStats[selectedBowler] = { 
        runs: 0, wickets: 0, balls: 0, name: newBowler?.name,
        wides: 0, noBalls: 0, maidens: 0 
      };
      setBowlerStats(updatedBowlerStats);
    }
    
    // Reset undo count for new over
    setUndoCountInOver(0);
    
    // Update player data in localStorage
    const playerData = JSON.parse(localStorage.getItem(`players-${matchId}`)) || {};
    localStorage.setItem(`players-${matchId}`, JSON.stringify({ 
      ...playerData, 
      bowler: selectedBowler
    }));
    
    // Start the new over
    setOverStarted(true);
    setIsOverComplete(false);
    persistMatchStatus({ isMatchStarted, isMatchPaused, overStarted: true });
    
    // Close modal and reset selection
    setShowBowlerModal(false);
    setSelectedBowler('');
  };

    const handleChangeBatsmen = () => {
      // Simple implementation to swap strike
      const newStrike = strike === 'batsman1' ? 'batsman2' : 'batsman1';
      setStrike(newStrike);
      
      // Update localStorage
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
      
      // Send update via socket
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
  
    // Get available bowlers according to cricket rules
    const getAvailableBowlers = () => {
      if (!bowlingTeamPlayers) return [];
      
      // In cricket, a bowler cannot bowl consecutive overs
      // Filter out the last bowler if there's more than one option
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
  
    // Format overs properly (whole number.balls)
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
  
        {/* Explicitly check if the match is started and not paused to show the scoring interface */}
        {(isMatchStarted && !isMatchPaused) && (
          <div className="space-y-4">
            {/* Toggle Over Button (only visible when match is started) */}
            <div className="flex justify-center">
              <button 
                onClick={handleToggleOver}
                className={`px-4 py-2 rounded-full shadow ${overStarted ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                {overStarted ? 'End Over' : 'Start Over'}
              </button>
            </div>
            
            {/* Only show run buttons when over is started */}
            {overStarted && (
              <>
                {/* Row 1: Standard runs */}
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
            
                {/* Row 2: Extras and big shots */}
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
                
                {/* Undo and Next Over Buttons */}
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
  
        {/* Current Over Information */}
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
  
        {/* Over History */}
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
  
        {/* Bowlers Summary */}
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
  
        {/* Wicket Modal */}
        {showWicketModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl w-11/12 max-w-md">
              <h3 className="text-lg font-bold text-red-700 mb-4">Wicket Fallen!</h3>
              
              {/* Wicket Type */}
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
              
              {/* Fielder (only for caught, run out, stumped) */}
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
              
              {/* Next Batsman */}
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
              
              {/* Action Buttons */}
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
                  disabled={!wicketType || (needsFielder && !fielder) || !nextBatsman}
                >
                  Confirm Wicket
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Bowler Selection Modal */}
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
              
              {/* Action Buttons */}
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
      </div>
    );
  };
  
  export default LiveScoringPanel;