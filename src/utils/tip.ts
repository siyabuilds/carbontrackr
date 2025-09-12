import { time } from "console";

export type TipData = {
  [category: string]: {
    [activity: string]: string | string[];
  };
};

export const tipData: TipData = {
  Transport: {
    "Car (10km)": [
      "Consider carpooling or using public transport",
      "Switch to an electric or hybrid vehicle",
      "Combine multiple errands into one trip",
      "Work from home when possible",
    ],
    "Bus (10km)": "Great choice! Public transport is already eco-friendly",
    "Train (10km)":
      "Excellent! Trains are one of the most efficient transport methods",
    "Bike (10km)": "Perfect! Keep cycling - it's carbon neutral and healthy",
    "Walk (10km)": "Amazing! Walking produces zero emissions",
    "Flight (1hr domestic)": [
      "Consider train or bus alternatives for shorter distances",
      "Combine business trips to reduce frequency",
      "Choose airlines with carbon offset programs",
      "Pack light to reduce fuel consumption",
    ],
    "Flight (international, economy)": [
      "Consider longer stays to justify the emissions",
      "Look into carbon offset programs",
      "Choose direct flights when possible",
      "Consider virtual meetings as an alternative",
    ],
  },
  Food: {
    "Beef (200g)": [
      "Try plant-based alternatives like lentils or beans",
      "Reduce portion sizes",
      "Choose grass-fed, local beef when possible",
      "Have meat-free days during the week",
    ],
    "Chicken (200g)": [
      "Good choice compared to beef! Consider free-range options",
      "Try plant-based proteins occasionally",
      "Buy from local, sustainable sources",
    ],
    "Pork (200g)": [
      "Consider leaner cuts to reduce environmental impact",
      "Try plant-based alternatives",
      "Source from local, sustainable farms",
    ],
    "Eggs (2 eggs)": [
      "Great protein choice! Consider free-range eggs",
      "Buy from local farms when possible",
    ],
    "Vegetarian Meal": "Excellent choice! Keep enjoying plant-based meals",
    "Vegan Meal": "Perfect! Vegan meals have the lowest carbon footprint",
    "Dairy (250ml milk)": [
      "Try oat, almond, or soy milk alternatives",
      "Choose organic, local dairy products",
      "Reduce daily dairy consumption",
    ],
  },
  Energy: {
    "Electricity (5 kWh)": [
      "Switch to LED bulbs",
      "Unplug devices when not in use",
      "Use natural light during the day",
      "Consider solar panels",
    ],
    "Electricity (10 kWh)": [
      "Invest in energy-efficient appliances",
      "Use a programmable thermostat",
      "Switch to renewable energy providers",
      "Improve home insulation",
    ],
    "Gas Heater (1 hr)": [
      "Lower the thermostat by 1-2 degrees",
      "Wear warmer clothes indoors",
      "Improve home insulation",
      "Consider a heat pump",
    ],
    "Air Conditioner (1 hr)": [
      "Set temperature to 24°C or higher",
      "Use fans to circulate air",
      "Close curtains during hot days",
      "Improve home insulation",
    ],
    "LED Lights (1 hr)": "Great! LEDs are already very efficient",
    "Boil kettle (1x)": [
      "Only boil the water you need",
      "Use a thermal carafe to keep water hot",
      "Consider an efficient electric kettle",
    ],
  },
  Waste: {
    "Landfill Waste (1 bag)": [
      "Reduce packaging by buying in bulk",
      "Compost organic waste",
      "Recycle everything possible",
      "Choose products with minimal packaging",
    ],
    "Recycled Waste (1 bag)": "Good job recycling! Keep it up",
    "Composted Waste (1 bag)": "Excellent! Composting is the best waste option",
    "Plastic Bottle Thrown": [
      "Always recycle plastic bottles",
      "Switch to a reusable water bottle",
      "Choose glass or aluminum alternatives",
    ],
    "Plastic Bottle Recycled": [
      "Great job recycling! Consider a reusable bottle",
      "Look for refillable options",
    ],
  },
  Water: {
    "Shower (10 mins)": [
      "Take shorter showers (5-7 minutes)",
      "Install a low-flow showerhead",
      "Turn off water while soaping",
      "Consider shower timers",
    ],
    Bath: [
      "Take showers instead of baths",
      "Share bath water with family members",
      "Use bath water for garden irrigation",
    ],
    "Tap left running (1 min)": [
      "Always turn off taps when not in use",
      "Fix leaky faucets immediately",
      "Install water-saving aerators",
    ],
    "Toilet Flush": [
      "Install a dual-flush toilet",
      "Put a water bottle in old toilet tanks",
      "Fix running toilets promptly",
    ],
    "Washing Machine (1 load)": [
      "Wash in cold water when possible",
      "Only run full loads",
      "Use eco-friendly detergents",
      "Air dry clothes instead of using a dryer",
    ],
    "Dishwasher (1 load)": [
      "Only run when fully loaded",
      "Use eco-mode settings",
      "Air dry dishes instead of heat drying",
      "Scrape dishes instead of pre-rinsing",
    ],
  },
  Shopping: {
    "New T-shirt": [
      "Buy from sustainable fashion brands",
      "Shop second-hand or vintage",
      "Choose quality items that last longer",
      "Consider clothing swaps with friends",
    ],
    "New Jeans": [
      "Look for sustainably made denim",
      "Buy second-hand jeans",
      "Take care of jeans to extend their life",
      "Choose timeless styles over trends",
    ],
    Smartphone: [
      "Keep your current phone longer",
      "Buy refurbished phones",
      "Recycle old phones properly",
      "Choose phones with replaceable parts",
    ],
    Laptop: [
      "Buy refurbished or second-hand",
      "Keep your current laptop longer",
      "Choose energy-efficient models",
      "Recycle old electronics properly",
    ],
    "Plastic Bag Used": [
      "Always bring reusable bags",
      "Refuse single-use bags",
      "Reuse plastic bags multiple times",
    ],
    "Plastic Bag Reused": "Good job reusing! Keep using reusable bags",
  },
} as const;

export const formatTipResponse = (
  category: string,
  activity: string,
  userId: string
) => {
  const tips = tipData[category]?.[activity];
  if (!tips) return "No tips available";

  const isLowEmission = typeof tips === "string";

  return {
    userId,
    category,
    activity,
    emissionLevel: isLowEmission ? "low" : "high",
    tipType: isLowEmission ? "positive" : "improvement",
    message: isLowEmission
      ? tips
      : tips[Math.floor(Math.random() * tips.length)],
    allTips: isLowEmission ? [tips] : tips,
    timestamp: new Date().toISOString(),
  };
};
