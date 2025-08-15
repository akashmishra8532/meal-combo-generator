import React, { useState, useEffect } from 'react';

// Import all necessary icons from lucide-react
import { Loader2, CalendarDays, Utensils, Soup, GlassWater, Sparkles, AlertCircle, ChefHat, Star, Heart, Zap } from 'lucide-react';

function App() {
  const [selectedDay, setSelectedDay] = useState('');
  const [weekCombos, setWeekCombos] = useState([]);
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
    setWeekCombos([]);
    setProfileRemarks('');

    try {
      const response = await fetch('https://meal-combo-generator.onrender.com/generate-combos', {
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
      setWeekCombos(data.weekCombos || []);
      setProfileRemarks(data.profile_remarks);
    } catch (err) {
      console.error('Error generating combos:', err);
      setError(err.message || 'An unexpected error occurred. Please check your network connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center p-2 sm:p-4 font-inter text-gray-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header Section */}
      <header className="w-full max-w-6xl text-center py-6 sm:py-8 md:py-12 lg:py-16 relative z-10 px-4">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <div className="relative">
            <ChefHat className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-purple-600 animate-bounce-slow" />
            <Sparkles className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-400 animate-pulse-slow" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 mb-3 sm:mb-4 tracking-tighter drop-shadow-lg leading-tight">
          Daily Dish Delights
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed px-2 sm:px-4">
          Discover unique, delicious meal combos curated just for your day, blending taste with perfect balance.
        </p>
        {userId && (
          <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-purple-200 inline-block">
            <p className="text-xs sm:text-sm text-gray-600">
              Your ID: <span className="font-mono bg-purple-100 px-2 sm:px-3 py-1 rounded-lg text-purple-700 select-all text-xs sm:text-xs md:text-sm">{userId}</span>
            </p>
          </div>
        )}
      </header>

      {/* Day Selection and Generation Section */}
      <section className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg mb-6 sm:mb-8 md:mb-12 border border-purple-100 relative overflow-hidden z-10 mx-4 sm:mx-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-50"></div>
        <div className="relative z-10">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-700 mb-4 sm:mb-6 md:mb-8 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 sm:mr-3 text-purple-500" />
            Choose Your Day
          </h2>
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <select
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 ease-in-out text-sm sm:text-base bg-white hover:border-purple-400 appearance-none pr-10 shadow-sm hover:shadow-md focus-ring"
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
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 flex items-center justify-center font-bold text-sm sm:text-base md:text-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group btn-hover-effect"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 sm:mr-3 text-white" /> Crafting...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 sm:mr-3 text-white" /> Generate Combos
                  </>
                )}
              </span>
            </button>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-xl text-center animate-fade-in">
                          <p className="text-red-600 text-xs sm:text-sm font-medium flex items-center justify-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> {error}
            </p>
            </div>
          )}
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-4 sm:p-8 space-y-3 sm:space-y-4 z-10">
          <div className="relative">
            <Loader2 className="animate-spin w-10 h-10 sm:w-12 sm:h-12 text-purple-500" />
            <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-base sm:text-lg text-gray-600 font-medium">Fetching delicious combos...</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Our AI chef is crafting your perfect meal</p>
          </div>
        </div>
      )}

      {/* Week Combo Display Section */}
      {!loading && weekCombos.length > 0 && (
        <section className="w-full max-w-7xl z-10 px-4">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-3 sm:mb-4 drop-shadow-sm">
              Weekly Meal Plan
            </h2>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-purple-200 shadow-lg max-w-4xl mx-auto">
              <p className="text-xs sm:text-sm md:text-base text-gray-700">
                <span className="font-bold text-purple-800">Week starting from {selectedDay}:</span> 
                <span className="text-gray-800 ml-1 sm:ml-2">{profileRemarks}</span>
              </p>
            </div>
          </div>

          {weekCombos.map((dayData, dayIndex) => (
            <div key={dayData.day} className="mb-8 sm:mb-12">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-700 mb-4 sm:mb-6 text-center">
                {dayData.day.charAt(0).toUpperCase() + dayData.day.slice(1)} - {dayData.dayProfile}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {dayData.combos.map((combo, index) => (
                  <ComboCard key={combo.combo_id || index} combo={combo} index={index} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Empty State */}
      {!loading && !error && weekCombos.length === 0 && selectedDay && (
        <div className="text-center mt-8 sm:mt-12 p-4 sm:p-8 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border border-purple-200 max-w-2xl mx-auto z-10 px-4">
          <div className="mb-3 sm:mb-4">
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto animate-pulse" />
          </div>
          <p className="text-base sm:text-lg text-gray-600 font-medium">
            Ready for a culinary adventure?
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
            Select a day and click 'Generate Combos' to unveil your personalized meal options!
          </p>
        </div>
      )}
    </div>
  );
}

const ComboCard = ({ combo, index }) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-indigo-100 transform hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 ease-out group relative overflow-hidden card-hover">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl"></div>
      
      {/* Card header with rating */}
      <div className="relative z-10 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-indigo-800 flex items-center">
            <Utensils className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 sm:mr-3 text-indigo-500 transform group-hover:rotate-6 transition-transform duration-300" />
            Combo #{index + 1}
          </h3>
          <div className="flex items-center bg-yellow-100 px-2 sm:px-3 py-1 rounded-full">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
            <span className="ml-1 text-xs sm:text-sm font-bold text-yellow-700">{combo.avg_operative_score}</span>
          </div>
        </div>
      </div>

      {/* Combo items */}
      <div className="relative z-10 space-y-3 sm:space-y-4 text-gray-700 mb-4 sm:mb-6">
        <ComboItem icon={<Soup className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />} label="Main Course" item={combo.main_course} />
        <ComboItem icon={<Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600" />} label="Side Dish" item={combo.side_dish} />
        <ComboItem icon={<GlassWater className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />} label="Drink" item={combo.drink} />
      </div>

      {/* Nutrition info */}
      <div className="relative z-10 pt-4 sm:pt-6 border-t border-gray-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <span className="text-sm sm:text-base font-bold text-purple-700">Total Calories:</span>
          <span className="text-purple-600 bg-purple-100 px-2 sm:px-3 py-1 sm:py-2 rounded-full font-bold text-sm sm:text-base self-start sm:self-auto">
            {combo.total_caloric_value} kcal
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="bg-gray-50 p-2 sm:p-3 rounded-xl">
            <p className="text-gray-600 font-medium text-xs sm:text-sm">Operative Score</p>
            <p className="text-gray-800 font-bold text-sm sm:text-base">{combo.avg_operative_score}</p>
          </div>
          <div className="bg-gray-50 p-2 sm:p-3 rounded-xl">
            <p className="text-gray-600 font-medium text-xs sm:text-sm">Spicy Profile</p>
            <p className="text-gray-800 font-bold text-sm sm:text-base">{combo.spicy_profile}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComboItem = ({ icon, label, item }) => (
  <div className="flex items-start gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors duration-200">
    <div className="flex-shrink-0 mt-1 p-1.5 sm:p-2 bg-white rounded-lg shadow-sm border border-gray-100">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs sm:text-xs md:text-sm font-medium text-gray-500 mb-1 uppercase tracking-wide">{label}:</p>
      <p className="text-xs sm:text-sm md:text-base font-bold text-gray-900 leading-tight mb-1">{item.name}</p>
      <p className="text-xs sm:text-xs md:text-sm text-gray-600 mb-2 leading-relaxed">{item.description}</p>
      <div className="flex flex-wrap gap-1 sm:gap-2 text-xs text-gray-500">
        <span className="bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-mono text-xs">
          {item.caloric_value} kcal
        </span>
        <span className="bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-mono text-xs">
          Score: {item.operative_score}
        </span>
        <span className="bg-red-100 text-red-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-mono text-xs">
          Spicy: {item.spicy_level}
        </span>
      </div>
    </div>
  </div>
);

export default App;
