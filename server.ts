import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { spawn } from "child_process";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini SDK to protect against module-level crashes if API key is not supplied immediately
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Fallback high-fidelity search database for Indian medical finding (tailored based on city/symptoms)
const FALLBACK_HOSPITALS = [
  {
    name: "Nanavati Max Super Speciality Hospital",
    city: "Mumbai",
    accreditation: "NABH Accredited",
    type: "High Type",
    rating: 4.8,
    reviews: 1240,
    baseCost: 180000,
    maxCost: 260000,
    specialists: ["Dr. A. Mehta (Cardiology)", "Dr. S. Kulkarni (Robotic Surgery)"],
    whyRecommended: "Advanced robotic-assisted surgery and 24/7 cardiac emergency protocols.",
    locationDesc: "S.V. Road, Vile Parle West, Mumbai",
    lat: 19.1026,
    lng: 72.8424,
    details: [
      { category: "Surgeon & Intervention Fee", cost: "₹85,000" },
      { category: "OT charges & Consumables", cost: "₹65,000" },
      { category: "Specialist Implant & Stent", cost: "₹70,000" },
      { category: "ICU & DayCare (3 Days)", cost: "₹40,000" }
    ]
  },
  {
    name: "Kokilaben Dhirubhai Ambani Hospital",
    city: "Mumbai",
    accreditation: "NABH Accredited",
    type: "High Type",
    rating: 4.6,
    reviews: 954,
    baseCost: 210000,
    maxCost: 300000,
    specialists: ["Dr. V. Patil (Interventional Cardiology)", "Dr. N. Shah (Rehab Specialist)"],
    whyRecommended: "Leading cardiac rehabilitation center with holistic post-op care plans.",
    locationDesc: "Rao Saheb Achutrao Patwardhan Marg, Four Bungalows, Mumbai",
    lat: 19.1311,
    lng: 72.8258,
    details: [
      { category: "Surgeon & Interventional Fee", cost: "₹95,000" },
      { category: "OT charges & Anesthesia", cost: "₹75,000" },
      { category: "Premium Drug Eluting Stent", cost: "₹85,000" },
      { category: "Executive Suite Care", cost: "₹45,000" }
    ]
  },
  {
    name: "Lilavati Hospital & Research Centre",
    city: "Mumbai",
    accreditation: "NABH Accredited",
    type: "Medium Type",
    rating: 4.4,
    reviews: 812,
    baseCost: 150000,
    maxCost: 220000,
    specialists: ["Dr. R. Khanna (Cardiology Consultant)", "Dr. M. Iyer (Cathlab Chief)"],
    whyRecommended: "Cost-effective Medical excellence with historically high success rates in stent placements.",
    locationDesc: "A.N. Road, Bandra West, Mumbai",
    lat: 19.0514,
    lng: 72.8291,
    details: [
      { category: "Surgeon Fees", cost: "₹70,000" },
      { category: "OT & Diagnostics", cost: "₹50,000" },
      { category: "Standard Stent & Consumables", cost: "₹65,000" },
      { category: "Ward Stay (3 Days)", cost: "₹35,000" }
    ]
  },
  {
    name: "Fortis Hospital Mulund",
    city: "Mumbai",
    accreditation: "NABH Accredited",
    type: "High Type",
    rating: 4.7,
    reviews: 654,
    baseCost: 195000,
    maxCost: 275000,
    specialists: ["Dr. S. Sharma (Heart Transplant)", "Dr. R. Mahajan (Cardiovascular Surgeon)"],
    whyRecommended: "Preeminent center for advanced bypass surgeries and critical cardiology procedures.",
    locationDesc: "Lal Bahadur Shastri Marg, Mulund West, Mumbai",
    lat: 19.1678,
    lng: 72.9372,
    details: [
      { category: "Surgeon & Surgical Fees", cost: "₹90,000" },
      { category: "Anesthesia & OT Support", cost: "₹60,000" },
      { category: "Stent Placement & Angiography", cost: "₹75,000" },
      { category: "Clinical Ward Care (4 Days)", cost: "₹50,000" }
    ]
  },
  {
    name: "Medanta - The Medicity",
    city: "Delhi NCR",
    accreditation: "NABH & JCI Accredited",
    type: "High Type",
    rating: 4.9,
    reviews: 2150,
    baseCost: 230000,
    maxCost: 320000,
    specialists: ["Dr. Naresh Trehan (Chairman Cardiovascular)", "Dr. Y. K. Mishra (Chief Cardio)"],
    whyRecommended: "World-class cardiovascular center with high-volume robotic keyhole surgery experience.",
    locationDesc: "Sector 38, Gurugram, Haryana",
    lat: 28.4357,
    lng: 77.0401,
    details: [
      { category: "Elite Specialist Surgery Fee", cost: "₹110,000" },
      { category: "OT & Robotic Platform Fee", cost: "₹85,000" },
      { category: "Premium Specialized Stents", cost: "₹85,000" },
      { category: "Critical ICU & Suite (3 Days)", cost: "₹40,000" }
    ]
  },
  {
    name: "Apollo Hospitals Greams Road",
    city: "Chennai",
    accreditation: "Joint Commission International",
    type: "High Type",
    rating: 4.8,
    reviews: 1845,
    baseCost: 175000,
    maxCost: 250000,
    specialists: ["Dr. Sengotvelu G. (Interventionalist)", "Dr. Dr. Y. Vijayachandra (Cathlab Lead)"],
    whyRecommended: "Pioneering angiogram/angioplasty center with decades of dedicated cardiac care.",
    locationDesc: "Greams Road, Thousand Lights, Chennai",
    lat: 13.0601,
    lng: 80.2514,
    details: [
      { category: "Intervention Specialist Fee", cost: "₹80,000" },
      { category: "OT Equipment Support", cost: "₹60,000" },
      { category: "Standard FDA-Approved Stent", cost: "₹70,000" },
      { category: "Care Suite charges (3 Days)", cost: "₹40,000" }
    ]
  }
];

// Helper to scale costs depending on budget target
function getEstimatedCostRange(baseMin: number, baseMax: number, budgetStr: string) {
  // Try to parse user budget number
  const numbersOnly = budgetStr.replace(/[^0-9]/g, "");
  const budget = numbersOnly ? parseInt(numbersOnly) : 250000;
  
  // Adjust base calculations proportionally if the user is budget constrained
  let scale = 1.0;
  if (budget < 150000) {
    scale = 0.85;
  } else if (budget > 350000) {
    scale = 1.15;
  }
  
  const minCost = Math.round((baseMin * scale) / 500) * 500;
  const maxCost = Math.round((baseMax * scale) / 500) * 500;
  return { minCost, maxCost };
}

// 1. API Route: Find Care - calling Python high-fidelity backend mapping script
app.post("/api/find-care", async (req, res) => {
  const { symptoms, city, age, budget, comorbidities } = req.body;

  if (!symptoms || !city) {
    return res.status(400).json({ error: "Symptoms and City are required fields." });
  }

  // Try calling the persistent Python server first (extremely fast)
  try {
    const response = await fetch("http://127.0.0.1:5000/api/find-care", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms, city, age, budget, comorbidities })
    });

    if (response.ok) {
      const result = await response.json();
      return res.json({
        success: true,
        data: result,
        isFallback: false
      });
    } else {
      console.warn("Python backend server returned error status:", response.status);
    }
  } catch (err: any) {
    console.warn("Could not connect to persistent Python backend server. Falling back to slow spawn...", err.message);
  }

  // Fallback to spawning a one-off Python process if the persistent server is down
  const pythonProcess = spawn("python", ["query_backend.py"], {
    env: { ...process.env }
  });

  let dataString = "";
  let errorString = "";

  pythonProcess.stdout.on("data", (data) => {
    dataString += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    errorString += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      console.error("Python script exited with code:", code, "error:", errorString);
      
      // Fallback to Express Legacy/Gemini logic if Python process fails
      return runFallbackMock(req, res, errorString);
    }

    try {
      const result = JSON.parse(dataString);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      res.json({
        success: true,
        data: result,
        isFallback: false
      });
    } catch (err: any) {
      console.error("Error parsing Python output:", err, "Raw output:", dataString);
      // Fallback to mock search result
      return runFallbackMock(req, res, err.message);
    }
  });

  // Write payload to python process stdin
  pythonProcess.stdin.write(JSON.stringify({ symptoms, city, age, budget, comorbidities }));
  pythonProcess.stdin.end();
});

// Helper for elegant fallback when Python process or API Key fails
function runFallbackMock(req: any, res: any, reason: string) {
  const { symptoms, city, budget } = req.body;
  const matchedCity = (city || "Mumbai").toLowerCase();

  const regionalHospitals = FALLBACK_HOSPITALS.filter(
    h => h.city.toLowerCase().includes(matchedCity) || matchedCity.includes(h.city.toLowerCase())
  );
  const referenceHospitals = regionalHospitals.length > 0 ? regionalHospitals : FALLBACK_HOSPITALS;

  let targetCondition = "Coronary Artery Disease";
  let targetProcedure = "Angioplasty (PTCA)";
  let targetSpeciality = "Cardiology";
  let condConfidence = 0.85;
  let requiredTests = ["ECG Required", "TMT Recommended", "Coronary Angiography"];

  if (symptoms.toLowerCase().includes("headache") || symptoms.toLowerCase().includes("dizzy")) {
    targetCondition = "Primary Hypertension";
    targetProcedure = "Diagnostic Workup / Medication Titration";
    targetSpeciality = "General Medicine / Neurology";
    requiredTests = ["BP Monitoring", "Serum Electrolytes", "Fundoscopy"];
  } else if (symptoms.toLowerCase().includes("knee") || symptoms.toLowerCase().includes("joint") || symptoms.toLowerCase().includes("climbing stairs")) {
    if (symptoms.toLowerCase().includes("chest pain") || symptoms.toLowerCase().includes("shortness of breath") || symptoms.toLowerCase().includes("breath")) {
      // Keep Coronary
    } else {
      targetCondition = "Osteoarthritis (Knee)";
      targetProcedure = "Total Knee Replacement (TKR)";
      targetSpeciality = "Orthopedics";
      requiredTests = ["Knee X-ray Bilateral", "Rheumatoid Factor", "MRI Joint"];
    }
  } else if (symptoms.toLowerCase().includes("stomach") || symptoms.toLowerCase().includes("abdominal") || symptoms.toLowerCase().includes("pain")) {
    if (symptoms.toLowerCase().includes("chest")) {
      // Keep Coronary
    } else {
      targetCondition = "Acute Appendicitis / Cholelithiasis";
      targetProcedure = "Laparoscopic Surgery";
      targetSpeciality = "Gastroenterology";
      requiredTests = ["Abdominal Ultrasound", "CBC Profile", "CT Abdomen"];
    }
  }

  const adaptedHospitals = referenceHospitals.map(h => {
    const { minCost, maxCost } = getEstimatedCostRange(h.baseCost, h.maxCost, budget || "200000");
    let whyRec = h.whyRecommended;
    if (targetCondition.toLowerCase().includes("osteoarthritis")) {
      whyRec = "Pioneering orthopedic wing with zero-error navigation systems and specialized post-op physical rehab support.";
    } else if (targetCondition.toLowerCase().includes("hypertension")) {
      whyRec = "Comprehensive diagnostic profile and world-renowned geriatric consultants specializing in vascular medicine.";
    } else if (targetCondition.toLowerCase().includes("appendicitis")) {
      whyRec = "State-of-the-art sterile operating theaters with quick turn-around keyhole laparoscopic solutions.";
    }

    return {
      ...h,
      estimatedCost: `₹${minCost.toLocaleString("en-IN")} - ₹${maxCost.toLocaleString("en-IN")}`,
      minVal: minCost,
      maxVal: maxCost,
      whyRecommended: whyRec,
      details: h.details.map((d, i) => {
        const factor = i === 0 ? 0.4 : i === 1 ? 0.25 : i === 2 ? 0.25 : 0.1;
        const labelCost = Math.round((minCost * factor) / 500) * 500;
        return {
          category: d.category,
          cost: `₹${labelCost.toLocaleString("en-IN")}`
        };
      })
    };
  });

  return res.json({
    success: true,
    data: {
      clinicalAnalysis: {
        condition: targetCondition,
        procedure: targetProcedure,
        speciality: targetSpeciality,
        confidence: condConfidence,
        requiredTests
      },
      hospitals: adaptedHospitals,
      isFallback: true,
      fallbackReason: reason
    }
  });
}


// 2. Chat with Medical Assistant Advisor
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const client = getGeminiClient();

  if (!client) {
    // Beautiful local chatbot fallback
    let reply = "Hello! I am your Arogya AI healthcare navigator. Based on your symptoms, I recommend seeing an accredited cardiologist or general practitioner. Is there a specific hospital or cost breakdown you would like me to explain?";
    
    const msgLower = message.toLowerCase();
    if (msgLower.includes("cost") || msgLower.includes("price") || msgLower.includes("budget") || msgLower.includes("package")) {
      reply = "Our data covers complete package estimates including doctor consult, Operation Theater, post-op care, and medical consumables. If your budget is constrained, looking at 'Medium Type' public accredited services can decrease your costs by up to 35%.";
    } else if (msgLower.includes("heart") || msgLower.includes("chest") || msgLower.includes("stairs") || msgLower.includes("pain")) {
      reply = "Chest pain while active is a classic clinical indicator. It is critical to obtain an ECG and Coronary Angiogram diagnostic to assess cardiovascular blockage. Our top recommended center in Mumbai is Nanavati Max Hospital due to their robotic-assisted cath labs.";
    } else if (msgLower.includes("nabh") || msgLower.includes("accredit") || msgLower.includes("accredited")) {
      reply = "NABH standards (National Accreditation Board for Hospitals & Healthcare Providers) guarantee that the facility strictly complies with security, patient care clinical safety frameworks, and standard infection-control protocols.";
    }

    return res.json({ reply, isFallback: true });
  }

  try {
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const chatInstance = client.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `
          You are Arogya AI, a friendly and highly empathetic expert medical navigator for Indian patients.
          Your goal is to explain symptoms, diagnostic test requirements, hospital credentials, and price estimates.
          Always prioritize patient safety, advise consulting real physicians, and render beautifully structured answers.
          Use bullet points, bold text, and a highly clinical yet calming tone.
          Avoid unformatted clutter. Do not generate markdown code-blocks containing system labels.
        `
      },
      history: formattedHistory
    });

    const response = await chatInstance.sendMessage({ message });
    res.json({ reply: response.text, isFallback: false });

  } catch (error: any) {
    console.error("Gemini Chat failed, using fallback:", error);
    res.json({
      reply: "Based on my clinical database, it's highly advised to get your vitals checked. Are there any specific hospital profiles or doctor specialties you'd like me to assist you with?",
      isFallback: true,
      apiError: error.message
    });
  }
});

let pythonServerProcess: any = null;

function startPythonBackend() {
  console.log("Starting Python high-fidelity backend server on port 5000...");
  pythonServerProcess = spawn("python", ["python_backend_server.py"], {
    env: { ...process.env, PORT: "5000" },
    stdio: "inherit"
  });

  pythonServerProcess.on("close", (code: number) => {
    console.log(`Python backend server exited with code ${code}. Restarting in 5 seconds...`);
    setTimeout(startPythonBackend, 5000);
  });
}

// Serve frontend assets using Express + Vite setup
async function startServer() {
  startPythonBackend();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
