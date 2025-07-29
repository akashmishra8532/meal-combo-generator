import React, { useState, useEffect } from 'react';

// Import all necessary icons from lucide-react
import { Loader2, CalendarDays, Utensils, Soup, GlassWater, Sparkles, AlertCircle } from 'lucide-react';

function App() {
  const [selectedDay, setSelectedDay] = useState('');
  const [combos, setCombos] = useState([]);
  const [profileRemarks, setProfileRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getFirebaseUserId = async () => {
      const initialAuthToken = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;

      if (initialAuthToken) {
        try {
          const decodedToken = JSON.parse(atob(initialAuthToken.split('.')[1]));
          setUserId(decodedToken.uid);
        } catch (e) {
          console.warn("Could not decode __initial_auth_token, generating random user ID for this session.");
          setUserId(crypto.randomUUID());
        }
      } else {
        setUserId(crypto.randomUUID());
      }
    };
    getFirebaseUserId();
  }, []);

  const generateCombos = async () => {
    if (!selectedDay) {
      setError('Please select a day first!');
      return;
    }

    setLoading(true);
    setError('');
    setCombos([]);
    setProfileRemarks('');

    try {
      const response = await fetch('http://localhost:3000/generate-combos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ day: selectedDay }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate combos. Please try again.');
      }

      const data = await response.json();
      setCombos(data.combos);
      setProfileRemarks(data.profile_remarks);
    } catch (err) {
      console.error('Error generating combos:', err);
      setError(err.message || 'An unexpected error occurred. Please check your network connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center p-4 font-inter text-gray-800">

      {/* Header Section */}
      <header className="w-full max-w-4xl text-center py-10 relative overflow-hidden">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-4 tracking-tighter drop-shadow-lg">
          <Sparkles className="inline-block w-12 h-12 mr-3 text-yellow-400 animate-pulse-slow" />
          Daily Dish Delights
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
          Discover unique, delicious meal combos curated just for your day, blending taste with perfect balance.
        </p>
        {userId && (
          <p className="text-sm text-gray-500 mt-4 opacity-75">
            Your User ID: <span className="font-mono bg-purple-100 px-2 py-1 rounded-md text-purple-700 select-all">{userId}</span>
          </p>
        )}
        {/* Subtle background element - Requires custom 'animate-blob' keyframe */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-48 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      </header>

      {/* Day Selection and Generation Section */}
      <section className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md mb-10 border border-purple-100 relative overflow-hidden">
        <h2 className="text-3xl font-bold text-purple-700 mb-8 flex items-center justify-center">
          <CalendarDays className="w-8 h-8 mr-3 text-purple-500" />
          Choose Your Day
        </h2>
        <div className="flex flex-col sm:flex-row gap-5 mb-7">
          <select
            className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 transition duration-300 ease-in-out text-lg bg-gray-50 hover:border-purple-400 appearance-none pr-10"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="">-- Select a Day --</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
          <button
            onClick={generateCombos}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 flex items-center justify-center font-bold text-xl disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-3 text-white" /> Crafting...
              </>
            ) : (
              'Generate Combos'
            )}
          </button>
        </div>
        {error && (
          <p className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 text-center text-base font-medium flex items-center justify-center animate-fade-in">
            <AlertCircle className="w-5 h-5 mr-2" /> {error}
          </p>
        )}
      </section>

      {/* Combo Display Section */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="animate-spin w-12 h-12 text-purple-500" />
          <span className="ml-4 text-xl text-gray-600 font-medium">Fetching delicious combos...</span>
        </div>
      )}

      {!loading && combos.length > 0 && (
        <section className="w-full max-w-5xl">
          <h2 className="text-4xl font-extrabold text-purple-700 mb-8 text-center drop-shadow-sm">
            Today's Exquisite Combos
          </h2>
          <p className="text-center text-lg text-gray-700 mb-10 p-5 bg-purple-50 rounded-2xl border border-purple-200 shadow-md">
            <span className="font-bold text-purple-800">Profile for {selectedDay}:</span> <span className="text-gray-800">{profileRemarks}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {combos.map((combo, index) => (
              <ComboCard key={combo.combo_id || index} combo={combo} index={index} />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && combos.length === 0 && selectedDay && (
        <p className="text-center text-gray-500 text-xl mt-12 p-6 bg-gray-50 rounded-xl shadow-inner border border-gray-200">
          Ready for a culinary adventure? Select a day and click 'Generate Combos' to unveil your personalized meal options!
        </p>
      )}
    </div>
  );
}

const ComboCard = ({ combo, index }) => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-100 transform hover:scale-[1.03] hover:shadow-2xl transition-all duration-300 ease-in-out group relative overflow-hidden">
      {/* Subtle background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
      <div className="relative z-10"> {/* Ensure content is above the background */}
        <h3 className="text-2xl font-extrabold text-indigo-800 mb-5 flex items-center border-b pb-4 border-indigo-100">
          <Utensils className="w-7 h-7 mr-3 text-indigo-500 transform group-hover:rotate-6 transition-transform duration-300" />
          Combo #{index + 1}
        </h3>
        <div className="space-y-4 text-gray-700">
          <ComboItem icon={<Soup className="w-6 h-6 text-green-600" />} label="Main Course" item={combo.main_course} />
          <ComboItem icon={<Sparkles className="w-6 h-6 text-yellow-600" />} label="Side Dish" item={combo.side_dish} />
          <ComboItem icon={<GlassWater className="w-6 h-6 text-blue-600" />} label="Drink" item={combo.drink} />
        </div>
        <div className="mt-7 pt-5 border-t border-gray-200 space-y-3 text-gray-800">
          <p className="flex justify-between items-center text-xl font-bold text-purple-700">
            Total Calories: <span className="text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{combo.total_caloric_value} kcal</span>
          </p>
          <p className="flex justify-between items-center text-sm text-gray-600">
            Avg. Operative Score: <span className="font-semibold text-gray-700">{combo.avg_operative_score}</span>
          </p>
          <p className="flex justify-between items-center text-sm text-gray-600">
            Spicy Profile: <span className="font-semibold text-gray-700">{combo.spicy_profile}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const ComboItem = ({ icon, label, item }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 mt-1 p-2 bg-gray-50 rounded-lg shadow-sm">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-0.5">{label}:</p>
      <p className="text-lg font-extrabold text-gray-900 leading-tight">{item.name}</p>
      <p className="text-xs text-gray-600 mt-1">{item.description}</p>
      <p className="text-sm text-gray-500 mt-1 font-mono">({item.caloric_value} kcal, Score: {item.operative_score}, Spicy: {item.spicy_level})</p>
    </div>
  </div>
);

export default App;