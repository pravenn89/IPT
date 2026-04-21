import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const INVOICE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    invoiceNumber: { type: Type.STRING, description: "The unique invoice number" },
    date: { type: Type.STRING, description: "Invoice date in YYYY-MM-DD format" },
    vendorName: { type: Type.STRING, description: "Name of the supplier or vendor" },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Line item description" },
          quantity: { type: Type.NUMBER, description: "Quantity of the item" },
          unitPrice: { type: Type.NUMBER, description: "Individual price of the item" },
          amount: { type: Type.NUMBER, description: "Total amount for this line item" }
        }
      }
    },
    taxAmount: { type: Type.NUMBER, description: "Total tax amount (GST, VAT, etc.)" },
    totalAmount: { type: Type.NUMBER, description: "Grand total of the invoice" },
    category: { type: Type.STRING, description: "Expense category (e.g., Software, Hardware, Travel, Office Supplies)" },
    natureOfService: { type: Type.STRING, description: "Succinct description of the goods or services provided" },
    itcStatus: { type: Type.STRING, enum: ["Eligible", "Blocked"], description: "ITC eligibility as per Section 17(5) of CGST Act 2017" },
    itcReason: { type: Type.STRING, description: "Brief explanation for ITC Blocked/Eligible status" },
    tdsSection: { type: Type.STRING, description: "Applicable TDS section per Income Tax Act FY 2024-25" },
    tdsRate: { type: Type.STRING, description: "Suggested TDS rate (percentage)" },
    tdsApplicable: { type: Type.STRING, enum: ["Yes", "No"], description: "Whether TDS is likely applicable" }
  },
  required: ["vendorName", "totalAmount", "itcStatus"]
};

export async function extractInvoiceDetails(file: File): Promise<Partial<InvoiceData>> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const model = "gemini-3-flash-preview";
  
  // Convert file to base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  const prompt = `Extract all details from this invoice image/PDF. 
Normalize all monetary values to Indian Rupees (INR). 
Identify the nature of goods or services.

1. GST ITC Analysis:
Check if Input Tax Credit (ITC) is blocked under Section 17(5) of the CGST Act, 2017.
Commonly Blocked: Food, membership, motor vehicles, personal consumption, works contract.
Determine 'itcStatus' (Eligible or Blocked) and provide 'itcReason'.

2. TDS Analysis:
Check TDS applicability as per Income Tax Act (FY 2024-25):
- 194C (Contractors): 1% Individual, 2% Others
- 194J (Professional/Technical): 2% Tech/Royalties/BPO, 10% Others
- 194I (Rent): 2% Plant/Machinery, 10% Land/Building
- 194H (Commission/Brokerage): 5%
- 194Q (Purchase of Goods): 0.1% if turnover > 10Cr and purchase > 50L (flag as Yes if purchase is significant)
Determine 'tdsApplicable' (Yes or No), 'tdsSection' (e.g., 194J), and 'tdsRate' (e.g., 10%).

Return structured JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: file.type } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: INVOICE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data extracted from invoice.");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Extraction Error:", error);
    throw error;
  }
}
