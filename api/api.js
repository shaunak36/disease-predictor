const fetch = require('node-fetch');

function computeRisk(text) {
  text = text.toLowerCase();
  const redFlags = ['chest pain','shortness of breath','difficulty breathing','unconscious','severe bleeding','stroke','slurred speech','seizure'];
  for (const r of redFlags) if (text.includes(r)) return 95;
  let score = 0;
  const keywords = ['pain','fever','bleeding','vomit','dizzy','weak','breath','breathing','chest','bleed','burn','swelling'];
  for (const k of keywords) if (text.includes(k)) score += 10;
  if (text.match(/severe|worst|intense|cannot|cant/i)) score += 30;
  if (text.match(/just now|sudden|suddenly|right now/i)) score += 15;
  return Math.min(100, score);
}

module.exports = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({error:'No text'});
    const prompt = `You are a calm first-aid assistant. A user says: "${text}". 
Give 1-2 empathetic sentences and immediate safe steps. If emergency, mention EMERGENCY.`;

    const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-large', {
      method:'POST',
      headers:{
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });
    const result = await response.json();
    const reply = Array.isArray(result) && result[0]?.generated_text ? result[0].generated_text : 'Sorry, could not generate.';
    const riskScore = computeRisk(text);
    res.status(200).json({ reply, riskScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({error:err.toString()});
  }
};
