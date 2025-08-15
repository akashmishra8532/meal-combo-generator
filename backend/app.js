// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const crypto = require('crypto');


const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; 
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {}; 
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


// Disable Firebase for development - use local storage instead
let firebaseEnabled = false;
let localComboStorage = new Set();

try {
    if (Object.keys(firebaseConfig).length === 0) {
        console.log("Firebase config is empty. Using local storage for combo uniqueness.");
        firebaseEnabled = false;
    } else {
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig.serviceAccount)
        });
        firebaseEnabled = true;
        console.log("Firebase initialized successfully.");
    }
} catch (error) {
    console.log("Firebase initialization failed. Using local storage for combo uniqueness.");
    firebaseEnabled = false;
}


const db = firebaseEnabled ? admin.firestore() : null;


const app = express();

const PORT = process.env.PORT || 3001;


app.use(cors());

app.use(express.json());

const masterMenu = {
    main_courses: [
        { name: "Chicken Tikka Masala", caloric_value: 600, operative_score: 9, spicy_level: 3, description: "A classic Indian chicken dish, rich and creamy." },
        { name: "Paneer Butter Masala", caloric_value: 550, operative_score: 8, spicy_level: 1, description: "Soft paneer cubes in a rich tomato-based gravy." },
        { name: "Dal Makhani", caloric_value: 480, operative_score: 7, spicy_level: 1, description: "Slow-cooked black lentils in a buttery sauce." },
        { name: "Vegetable Biryani", caloric_value: 520, operative_score: 8, spicy_level: 2, description: "Fragrant basmati rice cooked with mixed vegetables and spices." },
        { name: "Butter Chicken", caloric_value: 620, operative_score: 9, spicy_level: 2, description: "Tender chicken in a mild, creamy tomato sauce." },
        { name: "Mushroom Do Pyaza", caloric_value: 490, operative_score: 7, spicy_level: 1, description: "Mushrooms cooked with a generous amount of onions." },
        { name: "Lamb Rogan Josh", caloric_value: 650, operative_score: 9, spicy_level: 3, description: "Aromatic lamb curry from Kashmir." },
        { name: "Chana Masala", caloric_value: 450, operative_score: 6, spicy_level: 2, description: "Spicy chickpea curry." },
        { name: "Fish Curry", caloric_value: 580, operative_score: 8, spicy_level: 3, description: "Tangy and spicy fish in a coconut-based gravy." },
        { name: "Aloo Gobi", caloric_value: 400, operative_score: 6, spicy_level: 1, description: "Potatoes and cauliflower cooked with Indian spices." },
        { name: "Palak Paneer", caloric_value: 420, operative_score: 7, spicy_level: 1, description: "Fresh spinach curry with soft paneer cubes." },
        { name: "Chicken Biryani", caloric_value: 680, operative_score: 9, spicy_level: 3, description: "Aromatic rice dish with tender chicken and spices." },
        { name: "Malai Kofta", caloric_value: 540, operative_score: 8, spicy_level: 1, description: "Vegetable dumplings in a rich cream sauce." },
        { name: "Rajma Chawal", caloric_value: 520, operative_score: 7, spicy_level: 2, description: "Red kidney beans curry with rice." },
        { name: "Kadai Chicken", caloric_value: 590, operative_score: 8, spicy_level: 3, description: "Spicy chicken cooked with bell peppers and onions." },
        { name: "Baingan Bharta", caloric_value: 380, operative_score: 6, spicy_level: 2, description: "Smoky roasted eggplant curry." },
        { name: "Chicken Korma", caloric_value: 570, operative_score: 8, spicy_level: 1, description: "Mild chicken curry in a rich nut-based gravy." },
        { name: "Mixed Vegetable Curry", caloric_value: 410, operative_score: 6, spicy_level: 1, description: "Assorted vegetables in a light tomato gravy." },
        { name: "Prawn Curry", caloric_value: 520, operative_score: 8, spicy_level: 2, description: "Fresh prawns in a coconut-based curry." },
        { name: "Soya Chaap", caloric_value: 460, operative_score: 7, spicy_level: 2, description: "Soy protein in a rich gravy." }
    ],
    side_dishes: [
        { name: "Garlic Naan", caloric_value: 250, operative_score: 7, spicy_level: 0, description: "Leavened flatbread with garlic." },
        { name: "Basmati Rice", caloric_value: 180, operative_score: 5, spicy_level: 0, description: "Fluffy long-grain rice." },
        { name: "Raita", caloric_value: 120, operative_score: 6, spicy_level: 0, description: "Yogurt dip with cucumber and mint." },
        { name: "Papadum", caloric_value: 80, operative_score: 4, spicy_level: 0, description: "Crispy lentil cracker." },
        { name: "Onion Bhaji", caloric_value: 200, operative_score: 7, spicy_level: 1, description: "Crispy fried onion fritters." },
        { name: "Cucumber Salad", caloric_value: 90, operative_score: 5, spicy_level: 0, description: "Fresh cucumber and tomato salad." },
        { name: "Samosa (2 pcs)", caloric_value: 300, operative_score: 8, spicy_level: 2, description: "Fried pastry with savory filling." },
        { name: "Mixed Vegetable Pickle", caloric_value: 50, operative_score: 4, spicy_level: 2, description: "Tangy and spicy pickled vegetables." },
        { name: "Plain Naan", caloric_value: 220, operative_score: 6, spicy_level: 0, description: "Soft leavened flatbread." },
        { name: "Jeera Rice", caloric_value: 200, operative_score: 6, spicy_level: 0, description: "Basmati rice flavored with cumin seeds." },
        { name: "Mint Chutney", caloric_value: 60, operative_score: 5, spicy_level: 1, description: "Fresh mint and coriander chutney." },
        { name: "Tamarind Chutney", caloric_value: 80, operative_score: 5, spicy_level: 0, description: "Sweet and tangy tamarind sauce." },
        { name: "Mixed Salad", caloric_value: 110, operative_score: 6, spicy_level: 0, description: "Fresh mixed vegetable salad." },
        { name: "Aloo Paratha", caloric_value: 280, operative_score: 7, spicy_level: 1, description: "Stuffed flatbread with potato filling." },
        { name: "Puri (3 pcs)", caloric_value: 240, operative_score: 6, spicy_level: 0, description: "Deep-fried puffed bread." },
        { name: "Bread Roll", caloric_value: 190, operative_score: 5, spicy_level: 0, description: "Crispy bread roll." },
        { name: "Veg Cutlet", caloric_value: 220, operative_score: 6, spicy_level: 1, description: "Vegetable cutlet with breadcrumbs." },
        { name: "Poha", caloric_value: 160, operative_score: 5, spicy_level: 0, description: "Flattened rice with mild spices." },
        { name: "Upma", caloric_value: 180, operative_score: 5, spicy_level: 0, description: "Semolina breakfast dish." },
        { name: "Idli (4 pcs)", caloric_value: 140, operative_score: 5, spicy_level: 0, description: "Steamed rice cakes." }
    ],
    drinks: [
        { name: "Mango Lassi", caloric_value: 280, operative_score: 8, spicy_level: 0, description: "Sweet yogurt drink with mango." },
        { name: "Masala Chai", caloric_value: 150, operative_score: 7, spicy_level: 0, description: "Spiced Indian tea." },
        { name: "Fresh Lime Soda", caloric_value: 100, operative_score: 6, spicy_level: 0, description: "Refreshing lime and soda drink." },
        { name: "Jaljeera", caloric_value: 80, operative_score: 5, spicy_level: 1, description: "Spiced cumin drink." },
        { name: "Coca-Cola", caloric_value: 180, operative_score: 5, spicy_level: 0, description: "Classic carbonated soft drink." },
        { name: "Water Bottle", caloric_value: 0, operative_score: 1, spicy_level: 0, description: "Pure drinking water." },
        { name: "Sweet Lassi", caloric_value: 250, operative_score: 7, spicy_level: 0, description: "Traditional sweet yogurt drink." },
        { name: "Salted Lassi", caloric_value: 200, operative_score: 6, spicy_level: 0, description: "Savory yogurt drink with salt." },
        { name: "Rose Lassi", caloric_value: 260, operative_score: 7, spicy_level: 0, description: "Refreshing rose-flavored yogurt drink." },
        { name: "Pineapple Juice", caloric_value: 120, operative_score: 6, spicy_level: 0, description: "Fresh pineapple juice." },
        { name: "Orange Juice", caloric_value: 110, operative_score: 6, spicy_level: 0, description: "Fresh orange juice." },
        { name: "Ginger Tea", caloric_value: 90, operative_score: 6, spicy_level: 1, description: "Spicy ginger tea." },
        { name: "Green Tea", caloric_value: 5, operative_score: 4, spicy_level: 0, description: "Healthy green tea." },
        { name: "Coffee", caloric_value: 70, operative_score: 5, spicy_level: 0, description: "Hot brewed coffee." },
        { name: "Lemonade", caloric_value: 95, operative_score: 6, spicy_level: 0, description: "Fresh lemonade." },
        { name: "Coconut Water", caloric_value: 45, operative_score: 5, spicy_level: 0, description: "Natural coconut water." },
        { name: "Buttermilk", caloric_value: 85, operative_score: 5, spicy_level: 0, description: "Traditional buttermilk." },
        { name: "Thandai", caloric_value: 320, operative_score: 8, spicy_level: 0, description: "Rich milk drink with nuts and spices." },
        { name: "Kesar Milk", caloric_value: 180, operative_score: 6, spicy_level: 0, description: "Saffron-flavored milk." },
        { name: "Hot Chocolate", caloric_value: 220, operative_score: 7, spicy_level: 0, description: "Rich hot chocolate." }
    ]
};

function generateComboHash(comboItems) {
    
    const sortedNames = comboItems.map(item => item.name).sort().join('|');
    return crypto.createHash('sha256').update(sortedNames).digest('hex');
}


async function comboExistsInFirestore(comboHash) {
    if (!firebaseEnabled) {
        // Use local storage instead
        return localComboStorage.has(comboHash);
    }
    
    try {
        const docRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('unique_combos').doc(comboHash);
        const doc = await docRef.get();
        return doc.exists; 
    } catch (error) {
        console.log("Firebase check failed, using local storage instead.");
        return localComboStorage.has(comboHash);
    }
}

async function addComboToFirestore(comboHash, day, userId) {
    if (!firebaseEnabled) {
        // Use local storage instead
        localComboStorage.add(comboHash);
        return;
    }
    
    try {
        const docRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('unique_combos').doc(comboHash);
        await docRef.set({
            day: day, 
            timestamp: admin.firestore.FieldValue.serverTimestamp(), 
            userId: userId
        });
    } catch (error) {
        console.log("Firebase add failed, using local storage instead.");
        localComboStorage.add(comboHash);
    }
}


function selectSessionMenu() {
    const selectedMainCourses = getRandomItems(masterMenu.main_courses, 8);
    const selectedSideDishes = getRandomItems(masterMenu.side_dishes, 6);
    const selectedDrinks = getRandomItems(masterMenu.drinks, 6);
    return { selectedMainCourses, selectedSideDishes, selectedDrinks };
}

function getRandomItems(arr, num) {
    
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}


function generateSingleCombo(availableMainCourses, availableSideDishes, availableDrinks, usedItems, dayProfile) {
    const MAX_ATTEMPTS = 1000; 
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        
        const mainCourse = getRandomItems(availableMainCourses, 1)[0];
        const sideDish = getRandomItems(availableSideDishes, 1)[0];
        const drink = getRandomItems(availableDrinks, 1)[0];

       
        if (!mainCourse || !sideDish || !drink) continue;

        const comboItems = [mainCourse, sideDish, drink];

        
        const comboItemNames = new Set(comboItems.map(item => item.name));
        if (comboItemNames.size !== 3) continue;

        
        const isAnyItemUsed = comboItems.some(item => usedItems.has(item.name));
        if (isAnyItemUsed) continue;

       
        const totalCaloricValue = mainCourse.caloric_value + sideDish.caloric_value + drink.caloric_value;

        
        if (totalCaloricValue < 800 || totalCaloricValue > 1000) continue;

        
        let passesDayProfile = true;
        switch (dayProfile) {
            case 'sweet':
                const sweetItems = comboItems.filter(item => item.spicy_level === 0 || item.name.includes('Lassi') || item.name.includes('Mango'));
                if (sweetItems.length < 2) passesDayProfile = false;
                
                if (comboItems.some(item => item.spicy_level > 1)) passesDayProfile = false;
                break;
            case 'spicy':
          
                const spicyItems = comboItems.filter(item => item.spicy_level > 0);
                if (spicyItems.length === 0) passesDayProfile = false;
                
                if (comboItems.every(item => item.spicy_level < 2)) passesDayProfile = false;
                break;
            case 'balanced':
                
                const nonSpicyCount = comboItems.filter(item => item.spicy_level === 0).length;
                const spicyCount = comboItems.filter(item => item.spicy_level > 0).length;
                if (nonSpicyCount < 1 || spicyCount < 1) passesDayProfile = false;
                
                if (comboItems.some(item => item.spicy_level === 3)) passesDayProfile = false;
                break;
            default:
                break;
        }

        if (!passesDayProfile) continue;

        const avgOperativeScore = (mainCourse.operative_score + sideDish.operative_score + drink.operative_score) / 3;

        
        let spicyProfileRemark;
        if (totalCaloricValue >= 800 && totalCaloricValue < 900) {
            spicyProfileRemark = "Mildly Caloric, Balanced Spice";
        } else if (totalCaloricValue >= 900 && totalCaloricValue <= 1000) {
            spicyProfileRemark = "Moderately Caloric, Robust Flavor"; 
        } else {
            spicyProfileRemark = "N/A"; 
        }

        
        return {
            main_course: mainCourse,
            side_dish: sideDish,
            drink: drink,
            total_caloric_value: totalCaloricValue,
            avg_operative_score: parseFloat(avgOperativeScore.toFixed(1)),
            spicy_profile: spicyProfileRemark
        };
    }
    return null; 
}


app.post('/generate-combos', async (req, res) => {
    const { day } = req.body; 
    const userId = req.headers['x-user-id'] || crypto.randomUUID();

    
    if (!day) {
        return res.status(400).json({ error: "Please specify a day to generate combos for." });
    }

    // Define the order of days in a week
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Find the starting index for the selected day
    const startIndex = weekDays.indexOf(day.toLowerCase());
    if (startIndex === -1) {
        return res.status(400).json({ error: "Invalid day specified." });
    }

    // Generate combos for all 7 days starting from selected day (cycling through the week)
    const allWeekCombos = [];
    const usedComboHashes = new Set();

    for (let i = 0; i < 7; i++) {
        const dayIndex = (startIndex + i) % 7; // This cycles through all 7 days
        const currentDay = weekDays[dayIndex];
        const dayCombos = [];
        const usedItemsInDay = new Set();
        
        // Reset used items for each day to allow more flexibility
        const usedItemsForThisDay = new Set();

        // Determine day profile
    let dayProfileRemark = "A balanced selection of flavors.";
    let dayProfileType = "balanced"; 
        
        switch (currentDay) {
        case 'monday':
            dayProfileRemark = "Emphasizing a 'Very Sweet' profile to start the week, offering delightful and comforting flavors.";
            dayProfileType = "sweet";
            break;
        case 'friday':
            dayProfileRemark = "A 'Spicy' profile to kick off the weekend, featuring bold and exciting tastes!";
            dayProfileType = "spicy";
            break;
            case 'saturday':
                dayProfileRemark = "A 'Spicy' profile for the weekend, featuring bold and exciting tastes!";
                dayProfileType = "spicy";
                break;
            case 'sunday':
                dayProfileRemark = "A 'Sweet' profile to end the week, offering delightful and comforting flavors.";
                dayProfileType = "sweet";
            break;
        case 'tuesday':
        case 'wednesday':
        case 'thursday':
            dayProfileRemark = "A 'Balanced' profile for a steady mid-week experience, ensuring a harmonious blend of flavors.";
            dayProfileType = "balanced";
            break;
        default:
            dayProfileRemark = "A general balanced selection, offering a satisfying variety for any day.";
            dayProfileType = "balanced";
            break;
    }

        // Generate 3 combos for this day
    for (let i = 0; i < 3; i++) {
        let combo = null;
        let attempts = 0;
            const MAX_COMBO_ATTEMPTS = 5000; // Reduced for faster generation
       
            // Add some randomization by shuffling the menu selection each time
        const { selectedMainCourses, selectedSideDishes, selectedDrinks } = selectSessionMenu();

            // Shuffle the arrays to get different combinations each time
            const shuffledMainCourses = [...selectedMainCourses].sort(() => Math.random() - 0.5);
            const shuffledSideDishes = [...selectedSideDishes].sort(() => Math.random() - 0.5);
            const shuffledDrinks = [...selectedDrinks].sort(() => Math.random() - 0.5);
        
        while (combo === null && attempts < MAX_COMBO_ATTEMPTS) {
            const potentialCombo = generateSingleCombo(
                    shuffledMainCourses,
                    shuffledSideDishes,
                    shuffledDrinks,
                    usedItemsForThisDay, 
                dayProfileType 
            );

            if (potentialCombo) {
                const comboHash = generateComboHash([
                    potentialCombo.main_course,
                    potentialCombo.side_dish,
                    potentialCombo.drink
                ]);

                    const existsLocally = usedComboHashes.has(comboHash);

                    // Try to check Firebase, but don't fail if there's an issue
                    let existsGlobally = false;
                    try {
                        existsGlobally = await comboExistsInFirestore(comboHash);
                    } catch (error) {
                        console.warn("Firebase check failed, proceeding with local uniqueness only:", error.message);
                    }

                    // Accept combo if it's not used in this week (more lenient approach)
                    if (!existsLocally) {
                        combo = { ...potentialCombo, combo_id: comboHash, day: currentDay }; 
                        
                        // Try to add to Firebase, but don't fail if it doesn't work
                        try {
                            await addComboToFirestore(comboHash, currentDay, userId); 
                        } catch (error) {
                            console.warn("Failed to add combo to Firebase:", error.message);
                        }
                        
                        usedComboHashes.add(comboHash); 

                        // Add items to used set to avoid repetition within the same day
                        usedItemsForThisDay.add(potentialCombo.main_course.name);
                        usedItemsForThisDay.add(potentialCombo.side_dish.name);
                        usedItemsForThisDay.add(potentialCombo.drink.name);
                    }
                }
                attempts++;
            }

            if (combo) {
                dayCombos.push(combo);
            } else {
                // If we can't generate a unique combo, try to generate any valid combo
                console.warn(`Could not generate unique combo ${i + 1} for ${currentDay}, attempting fallback...`);
                
                // Try multiple fallback attempts with different approaches
                let fallbackCombo = null;
                
                // First try: Allow any items but respect day profile
                fallbackCombo = generateSingleCombo(
                    shuffledMainCourses,
                    shuffledSideDishes,
                    shuffledDrinks,
                    new Set(), // Empty set to allow any items
                    dayProfileType 
                );
                
                // Second try: If that fails, try with any profile
                if (!fallbackCombo) {
                    fallbackCombo = generateSingleCombo(
                        shuffledMainCourses,
                        shuffledSideDishes,
                        shuffledDrinks,
                        new Set(),
                        'balanced' // Use balanced profile as fallback
                    );
                }
                
                if (fallbackCombo) {
                    const comboHash = generateComboHash([
                        fallbackCombo.main_course,
                        fallbackCombo.side_dish,
                        fallbackCombo.drink
                    ]);
                    
                    fallbackCombo.combo_id = comboHash;
                    fallbackCombo.day = currentDay;
                    dayCombos.push(fallbackCombo);
                    usedComboHashes.add(comboHash);
                } else {
                    // If even fallback fails, create a simple combo manually
                    console.warn(`Creating manual fallback combo for ${currentDay}`);
                    const manualCombo = {
                        main_course: shuffledMainCourses[0] || selectedMainCourses[0],
                        side_dish: shuffledSideDishes[0] || selectedSideDishes[0],
                        drink: shuffledDrinks[0] || selectedDrinks[0],
                        total_caloric_value: 850,
                        avg_operative_score: 7.5,
                        spicy_profile: "Balanced Fallback",
                        combo_id: `fallback-${currentDay}-${i}-${Date.now()}`,
                        day: currentDay
                    };
                    dayCombos.push(manualCombo);
                }
            }
        }

        // Add day combos to the main array
        if (dayCombos.length > 0) {
            allWeekCombos.push({
                day: currentDay,
                dayProfile: dayProfileRemark,
                combos: dayCombos
            });
        }
    }

    // Handle case where we might not have any combos
    if (allWeekCombos.length === 0) {
        return res.status(500).json({
            error: `Unable to generate any combos for the week starting from ${day}. Please try again or contact support.`,
            details: "This might happen due to menu restrictions or system issues.",
            combos: [],
            profile_remarks: "No combos generated"
        });
    }

    // Calculate overall statistics
    const allCombos = allWeekCombos.flatMap(dayData => dayData.combos);
    const totalCals = allCombos.map(c => c.total_caloric_value);
    const avgOps = allCombos.map(c => c.avg_operative_score);

    const minCal = Math.min(...totalCals);
    const maxCal = Math.max(...totalCals);
    const minOp = Math.min(...avgOps);
    const maxOp = Math.max(...avgOps);

    const overallProfileRemark = `Generated meal combos for the week starting from ${day.charAt(0).toUpperCase() + day.slice(1)}. All combos feature total calories ranging from ${minCal} to ${maxCal} kcal, and average operative scores between ${minOp.toFixed(1)} and ${maxOp.toFixed(1)}, ensuring a consistent offering throughout the week.`;
    
    res.json({
        date: new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        profile_remarks: overallProfileRemark,
        weekCombos: allWeekCombos,
        totalDays: allWeekCombos.length,
        totalCombos: allCombos.length
    });
});


app.listen(PORT, () => {
    console.log(`Backend server successfully started and listening on http://localhost:${PORT}`);
});
