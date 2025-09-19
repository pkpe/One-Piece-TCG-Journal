import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Download, Upload, TrendingUp, Target, Calendar, Users } from 'lucide-react';

const OnePieceJournal = () => {
  const [deckList, setDeckList] = useState([]);
  const [gameLog, setGameLog] = useState([]);
  const [showAddDeck, setShowAddDeck] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);

  const [newDeck, setNewDeck] = useState({
    name: '',
    colors: '',
    leader: '',
    cardList: ''
  });

  const [newGame, setNewGame] = useState({
    date: new Date().toISOString().split('T')[0],
    deckUsed: '',
    opponent: '',
    opponentDeck: '',
    result: '',
    gameLength: '',
    notes: '',
    mulligans: 0
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedDecks = localStorage.getItem('opTcgDecks');
    const savedGames = localStorage.getItem('opTcgGames');
    if (savedDecks) setDeckList(JSON.parse(savedDecks));
    if (savedGames) setGameLog(JSON.parse(savedGames));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('opTcgDecks', JSON.stringify(deckList));
  }, [deckList]);

  useEffect(() => {
    localStorage.setItem('opTcgGames', JSON.stringify(gameLog));
  }, [gameLog]);

  // Export data to text file
  const exportData = () => {
    const data = {
      deckList,
      gameLog,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `one-piece-tcg-journal-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import data from text file
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.deckList && data.gameLog) {
          setDeckList(data.deckList);
          setGameLog(data.gameLog);
          alert(`Successfully imported ${data.deckList.length} decks and ${data.gameLog.length} games!`);
        } else {
          alert('Invalid file format. Please select a valid journal export file.');
        }
      } catch (error) {
        alert('Error reading file. Please make sure it\'s a valid journal export.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const addDeck = () => {
    if (newDeck.name.trim() && !deckList.find(d => d.name === newDeck.name)) {
      setDeckList([...deckList, { 
        ...newDeck,
        dateCreated: new Date().toISOString().split('T')[0]
      }]);
      setNewDeck({ name: '', colors: '', leader: '', cardList: '' });
      setShowAddDeck(false);
    } else if (!newDeck.name.trim()) {
      alert('Please enter a deck name');
    } else {
      alert('A deck with this name already exists');
    }
  };

  const deleteDeck = (deckName) => {
    setDeckList(deckList.filter(d => d.name !== deckName));
    setGameLog(gameLog.filter(g => g.deckUsed !== deckName));
  };

  const addGame = () => {
    if (newGame.deckUsed && newGame.opponent && newGame.result) {
      setGameLog([...gameLog, { ...newGame, id: Date.now() }]);
      setNewGame({
        date: new Date().toISOString().split('T')[0],
        deckUsed: '',
        opponent: '',
        opponentDeck: '',
        result: '',
        gameLength: '',
        notes: '',
        mulligans: 0
      });
      setShowAddGame(false);
    } else {
      alert('Please fill in deck, opponent, and result fields');
    }
  };

  const deleteGame = (gameId) => {
    setGameLog(gameLog.filter(g => g.id !== gameId));
  };

  // Analytics calculations
  const getDeckStats = () => {
    return deckList.map(deck => {
      const deckGames = gameLog.filter(g => g.deckUsed === deck.name);
      const wins = deckGames.filter(g => g.result === 'Win').length;
      const losses = deckGames.filter(g => g.result === 'Loss').length;
      const draws = deckGames.filter(g => g.result === 'Draw').length;
      const total = deckGames.length;
      
      return {
        name: deck.name,
        colors: deck.colors,
        leader: deck.leader,
        wins,
        losses,
        draws,
        total,
        winRate: total > 0 ? ((wins / total) * 100).toFixed(1) : 0
      };
    });
  };

  const getOpponentStats = () => {
    const opponentMap = {};
    gameLog.forEach(game => {
      if (!opponentMap[game.opponent]) {
        opponentMap[game.opponent] = { wins: 0, losses: 0, draws: 0 };
      }
      if (game.result === 'Win') opponentMap[game.opponent].wins++;
      else if (game.result === 'Loss') opponentMap[game.opponent].losses++;
      else opponentMap[game.opponent].draws++;
    });

    return Object.entries(opponentMap).map(([opponent, stats]) => ({
      opponent,
      ...stats,
      total: stats.wins + stats.losses + stats.draws,
      winRate: stats.wins + stats.losses > 0 ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) : 0
    }));
  };

  const getTimelineData = () => {
    const timeline = {};
    gameLog.forEach(game => {
      const date = game.date;
      if (!timeline[date]) {
        timeline[date] = { date, wins: 0, losses: 0, draws: 0 };
      }
      if (game.result === 'Win') timeline[date].wins++;
      else if (game.result === 'Loss') timeline[date].losses++;
      else timeline[date].draws++;
    });

    return Object.values(timeline).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const deckStats = getDeckStats();
  const opponentStats = getOpponentStats();
  const timelineData = getTimelineData();

  const overallStats = {
    totalGames: gameLog.length,
    totalWins: gameLog.filter(g => g.result === 'Win').length,
    totalLosses: gameLog.filter(g => g.result === 'Loss').length,
    totalDraws: gameLog.filter(g => g.result === 'Draw').length,
    overallWinRate: gameLog.length > 0 ? ((gameLog.filter(g => g.result === 'Win').length / gameLog.filter(g => g.result !== 'Draw').length) * 100).toFixed(1) : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">One Piece TCG Journal</h1>
          <p className="text-gray-600 mb-4">Track your gameplay, analyze your performance, and optimize your strategy</p>
          
          {/* Export/Import Controls */}
          <div className="flex justify-center gap-4">
            <button 
              onClick={exportData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Data
            </button>
            <label className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              Import Data
              <input
                type="file"
                accept=".txt,.json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-gray-800">{overallStats.totalGames}</h3>
            <p className="text-gray-600">Total Games</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-green-600">{overallStats.overallWinRate}%</h3>
            <p className="text-gray-600">Win Rate</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-gray-800">{deckList.length}</h3>
            <p className="text-gray-600">Active Decks</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <Users className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-gray-800">{opponentStats.length}</h3>
            <p className="text-gray-600">Opponents Faced</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Deck Management */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Deck Collection</h2>
              <button 
                onClick={() => setShowAddDeck(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Deck
              </button>
            </div>

            {showAddDeck && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                <div className="grid grid-cols-1 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Deck Name (e.g., Red/Yellow Luffy)"
                    value={newDeck.name}
                    onChange={(e) => setNewDeck({...newDeck, name: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Colors (e.g., Red/Yellow)"
                      value={newDeck.colors}
                      onChange={(e) => setNewDeck({...newDeck, colors: e.target.value})}
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Leader (e.g., ST22-001)"
                      value={newDeck.leader}
                      onChange={(e) => setNewDeck({...newDeck, leader: e.target.value})}
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <textarea
                  placeholder="Paste your deck list here (e.g., 1xST22-001, 4xST22-002, etc.)"
                  value={newDeck.cardList}
                  onChange={(e) => setNewDeck({...newDeck, cardList: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows="8"
                />

                <div className="flex gap-2">
                  <button 
                    onClick={addDeck}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Save Deck
                  </button>
                  <button 
                    onClick={() => setShowAddDeck(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {deckList.map(deck => {
                const stats = deckStats.find(d => d.name === deck.name);
                return (
                  <div key={deck.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{deck.name}</h3>
                        <p className="text-sm text-gray-600">Colors: {deck.colors}</p>
                        <p className="text-sm text-gray-600">Leader: {deck.leader}</p>
                        {deck.cardList && (
                          <details className="mt-2">
                            <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                              View Deck List ({deck.cardList.split('\n').filter(line => line.trim()).length} cards)
                            </summary>
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono whitespace-pre-line max-h-32 overflow-y-auto">
                              {deck.cardList}
                            </div>
                          </details>
                        )}
                        {stats && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            {stats.wins}W-{stats.losses}L-{stats.draws}D ({stats.winRate}%)
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => deleteDeck(deck.name)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {deckList.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No decks added yet. Click "Add Deck" to get started!
                </div>
              )}
            </div>
          </div>

          {/* Game Logging */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Game Log</h2>
              <button 
                onClick={() => setShowAddGame(true)}
                disabled={deckList.length === 0}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Log Game
              </button>
            </div>

            {showAddGame && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="date"
                    value={newGame.date}
                    onChange={(e) => setNewGame({...newGame, date: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <select
                    value={newGame.deckUsed}
                    onChange={(e) => setNewGame({...newGame, deckUsed: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Deck</option>
                    {deckList.map(deck => (
                      <option key={deck.name} value={deck.name}>{deck.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Opponent Name"
                    value={newGame.opponent}
                    onChange={(e) => setNewGame({...newGame, opponent: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Opponent Deck"
                    value={newGame.opponentDeck}
                    onChange={(e) => setNewGame({...newGame, opponentDeck: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <select
                    value={newGame.result}
                    onChange={(e) => setNewGame({...newGame, result: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Result</option>
                    <option value="Win">Win</option>
                    <option value="Loss">Loss</option>
                    <option value="Draw">Draw</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Game Length (min)"
                    value={newGame.gameLength}
                    onChange={(e) => setNewGame({...newGame, gameLength: e.target.value})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Mulligans"
                    value={newGame.mulligans}
                    onChange={(e) => setNewGame({...newGame, mulligans: parseInt(e.target.value) || 0})}
                    className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <textarea
                  placeholder="Game notes and key plays..."
                  value={newGame.notes}
                  onChange={(e) => setNewGame({...newGame, notes: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows="3"
                />

                <div className="flex gap-2">
                  <button 
                    onClick={addGame}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Save Game
                  </button>
                  <button 
                    onClick={() => setShowAddGame(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {gameLog.slice(-10).reverse().map(game => (
                <div key={game.id} className="border border-gray-200 rounded p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {game.deckUsed} vs {game.opponent}
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          game.result === 'Win' ? 'bg-green-100 text-green-800' :
                          game.result === 'Loss' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {game.result}
                        </span>
                      </p>
                      <p className="text-gray-600">{game.date} • {game.opponentDeck}</p>
                      {game.notes && <p className="text-gray-700 mt-1">{game.notes}</p>}
                    </div>
                    <button 
                      onClick={() => deleteGame(game.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {gameLog.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No games logged yet. Add a deck first, then log your games!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        {gameLog.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Deck Performance Chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Deck Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deckStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="wins" fill="#10b981" name="Wins" />
                    <Bar dataKey="losses" fill="#ef4444" name="Losses" />
                    <Bar dataKey="draws" fill="#6b7280" name="Draws" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Win Rate Pie Chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Overall Results</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Wins', value: overallStats.totalWins, fill: '#10b981' },
                        { name: 'Losses', value: overallStats.totalLosses, fill: '#ef4444' },
                        { name: 'Draws', value: overallStats.totalDraws, fill: '#6b7280' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Timeline */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Performance Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="wins" stroke="#10b981" name="Wins" />
                  <Line type="monotone" dataKey="losses" stroke="#ef4444" name="Losses" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Opponent Statistics */}
            {opponentStats.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Head-to-Head Records</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Opponent</th>
                        <th className="text-center p-2">Games</th>
                        <th className="text-center p-2">Wins</th>
                        <th className="text-center p-2">Losses</th>
                        <th className="text-center p-2">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opponentStats.map(opponent => (
                        <tr key={opponent.opponent} className="border-b">
                          <td className="p-2 font-medium">{opponent.opponent}</td>
                          <td className="text-center p-2">{opponent.total}</td>
                          <td className="text-center p-2 text-green-600">{opponent.wins}</td>
                          <td className="text-center p-2 text-red-600">{opponent.losses}</td>
                          <td className="text-center p-2 font-semibold">{opponent.winRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OnePieceJournal;
