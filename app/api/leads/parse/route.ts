import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { industryFields } from '@/lib/industry-fields';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, businessSector } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Get industry-specific fields schema for the business sector
    const customFieldsConfig = businessSector && industryFields[businessSector]
      ? industryFields[businessSector]
      : [];

    // Build the custom fields schema description for the prompt
    const customFieldsDescription = customFieldsConfig.length > 0
      ? customFieldsConfig.map(field => {
          let fieldDesc = `- ${field.name} (${field.type}): ${field.label}`;
          if (field.required) fieldDesc += ' [REQUIRED]';
          if (field.helperText) fieldDesc += ` - ${field.helperText}`;
          if (field.options) fieldDesc += ` - Options: ${field.options.join(', ')}`;
          return fieldDesc;
        }).join('\n')
      : 'No custom fields for this sector';

    // Sector-specific context and examples
    const sectorContexts: Record<string, string> = {
      HOME_SERVICES: `You are extracting leads for a HOME SERVICES company (HVAC, plumbing, electrical, roofing, etc.).

Common terminology to recognize:
- Service types: "HVAC replacement", "AC repair", "plumbing fix", "water heater", "furnace", "roof replacement"
- Property details: square footage, number of units, residential vs commercial
- Urgency: "emergency", "urgent", "broken", "not working", "leaking"
- Budget: dollar amounts, "get quotes", "ballpark estimate"
- Timeline: "ASAP", "next week", "winter", "before summer"

IMPORTANT BUDGET MAPPING - Map actual dollar amounts to these ranges:
- Under $1,000: Small repairs, maintenance
- $1,000 - $5,000: Minor installations, repairs
- $5,000 - $15,000: Major repairs, single unit replacements (maps "$8k-$12k")
- $15,000 - $50,000: Complete system overhauls, multi-unit
- Over $50,000: Large commercial projects
- Not sure: No specific budget mentioned

Examples of what you might see:
- "John needs new HVAC for 3000 sq ft home, budget $8k, wants done before summer" -> budgetRange: "$5,000 - $15,000"
- "Commercial building owner, 10 units, AC not working, needs emergency service" -> urgency: "Emergency (24-48 hours)"`,

      LEGAL_SERVICES: `You are extracting leads for a LAW FIRM (personal injury, family law, criminal defense, etc.).

Common terminology to recognize:
- Case types: "car accident", "slip and fall", "divorce", "custody", "DUI", "workers comp"
- Injury details: "back pain", "whiplash", "broken bones", "medical bills"
- Incident dates: when accident/incident occurred
- Insurance: "other driver's insurance", "uninsured", "claim denied"
- Urgency: statute of limitations, court dates

Examples of what you might see:
- "Jane was in car accident 2 months ago, neck injury, other driver at fault, insurance not paying"
- "Need divorce lawyer, married 10 years, 2 kids, spouse filed papers"`,

      FINANCIAL_SERVICES: `You are extracting leads for FINANCIAL SERVICES (insurance, loans, financial planning, mortgages).

Common terminology to recognize:
- Service types: "life insurance", "mortgage", "refinance", "401k", "retirement planning"
- Coverage amounts: dollar amounts for policies, loan amounts
- Credit info: "good credit", "credit score", "first-time buyer"
- Family situation: dependents, spouse, children
- Timeline: "need by closing", "shopping around", "policy expiring"

Examples of what you might see:
- "Family of 4, need $500k life insurance, both parents healthy non-smokers"
- "First time homebuyer, looking at $300k houses, pre-approval needed"`,

      REAL_ESTATE: `You are extracting leads for REAL ESTATE (buying, selling, renting, property management).

Common terminology to recognize:
- Property types: "single family", "condo", "townhouse", "multi-family", "commercial"
- Transaction type: "buying", "selling", "renting", "leasing"
- Location: neighborhoods, zip codes, school districts
- Price range: budget, asking price, comparable sales
- Timeline: "ready to buy", "need to sell fast", "lease ending"

Examples of what you might see:
- "Looking to buy 3br home in downtown, budget $400-500k, pre-approved, want to move by summer"
- "Selling condo, 2br/2ba, needs staging and photos, want agent who knows the building"`,

      HEALTHCARE: `You are extracting leads for HEALTHCARE (dental, medical, wellness, cosmetic procedures).

Common terminology to recognize:
- Services: "teeth whitening", "veneers", "implants", "Invisalign", "cleaning", "consultation"
- Patient info: age, insurance status, medical history
- Concerns: pain, cosmetic issues, preventive care
- Insurance: "insurance covers", "out of pocket", "payment plans"
- Timeline: "ASAP for pain", "before wedding", "routine checkup"

Examples of what you might see:
- "Patient wants veneers consult, getting married in 6 months, has dental insurance"
- "New patient, family of 4, looking for family dentist, needs cleaning and checkups"`,

      B2B_SAAS: `You are extracting leads for B2B SaaS COMPANY (software, platforms, business tools).

Common terminology to recognize:
- Company size: "team of 10", "50 employees", "enterprise", "startup"
- Current tools: what they're using now, pain points, limitations
- Use case: specific problems they're trying to solve
- Decision maker: title often indicates buying power (CEO, CTO, VP, Director)
- Timeline: "evaluating options", "current contract ending", "urgent need"

Examples of what you might see:
- "CTO at 200-person company, current CRM not scaling, budget $50k/year, need migration help"
- "Startup founder, 8-person team, looking for project management tool, switching from Asana"`,

      EDUCATION: `You are extracting leads for EDUCATION (courses, bootcamps, training, certifications).

Common terminology to recognize:
- Program interest: "coding bootcamp", "data science", "web development", "certification"
- Background: current education, work experience, career goals
- Timeline: start date, graduation needs, employment timeline
- Funding: "need financing", "employer paying", "GI Bill", "scholarships"
- Goals: "career change", "upskill", "get certified", "promotion"

Examples of what you might see:
- "Career changer, currently in retail, wants to learn web development, can start next cohort"
- "Engineer wants data science cert, employer will cover tuition, prefers evening classes"`,

      AUTOMOTIVE: `You are extracting leads for AUTOMOTIVE (car sales, service, financing).

Common terminology to recognize:
- Vehicle interest: make, model, year, new vs used
- Trade-in: current vehicle details
- Financing: "need financing", "cash buyer", credit situation, down payment
- Timeline: "need car this week", "lease ending", "just looking"
- Features: color, trim, specific features they want

Examples of what you might see:
- "Looking at 2024 Tesla Model 3, have $10k down, good credit, trade-in 2018 Honda"
- "Need SUV for family, 3 row seating, budget $40k, financing needed, want to test drive"`,

      HOSPITALITY: `You are extracting leads for HOSPITALITY (hotels, restaurants, event venues, catering).

Common terminology to recognize:
- Business types: "restaurant", "hotel", "wedding venue", "catering service", "bar", "bed & breakfast"
- Service needs: "POS system", "reservation software", "event management", "marketing", "staff training"
- Capacity: number of seats, rooms, guests, covers
- Budget: investment amounts for systems, services, renovations
- Timeline: "opening soon", "remodel", "need before peak season", "immediate"

Examples of what you might see:
- "New restaurant owner, 50 seats, needs POS and reservation system, opening in 2 months, budget $15k"
- "Event venue manager, 200 capacity, looking for better booking software, current system inadequate"`,

      FITNESS_WELLNESS: `You are extracting leads for FITNESS & WELLNESS (gyms, studios, personal training, spa).

Common terminology to recognize:
- Business types: "gym", "yoga studio", "CrossFit", "personal trainer", "pilates", "spa", "wellness center"
- Membership info: current members, target membership, growth goals
- Challenges: "retention", "getting new members", "billing issues", "scheduling problems"
- Services needed: "membership software", "lead generation", "marketing", "equipment financing"
- Budget: monthly or annual budget for services

Examples of what you might see:
- "Yoga studio owner, 120 members, struggling with retention, need better marketing, budget $2k/month"
- "Opening new CrossFit box, startup phase, need everything from membership system to lead gen"`,

      CONSTRUCTION: `You are extracting leads for CONSTRUCTION (general contractors, remodeling, commercial build-outs).

Common terminology to recognize:
- Project types: "new construction", "renovation", "remodel", "addition", "commercial build-out"
- Property types: residential, commercial, multi-family, industrial
- Project scope: size, materials, special requirements, square footage
- Budget/value: project budgets often in hundreds of thousands or millions
- Timeline: start date, completion deadline, planning phase
- Permits: permit status, zoning, approvals

Examples of what you might see:
- "Homeowner wants to add 500 sq ft addition, 2 bedrooms, budget $150k, permits pending, start spring"
- "Commercial developer, 10,000 sq ft retail space build-out, $2M budget, need contractor with retail experience"`,

      ECOMMERCE: `You are extracting leads for ECOMMERCE (online stores, marketplace sellers, DTC brands).

Common terminology to recognize:
- Platforms: "Shopify", "WooCommerce", "Amazon", "Etsy", "custom built"
- Business stage: "pre-launch", "new store", "growing", "established"
- Revenue: monthly or annual revenue figures
- Services needed: "store setup", "marketing", "SEO", "traffic", "fulfillment", "product sourcing"
- Product types: categories they sell
- Challenges: "need more traffic", "conversion issues", "fulfillment problems"

Examples of what you might see:
- "Shopify store owner, $25k/month revenue, need help with Google Ads and SEO, budget $5k"
- "Planning to launch fashion brand, no store yet, need full setup and launch marketing, budget $15k"`,

      INSURANCE: `You are extracting leads for INSURANCE (life, health, auto, home, business insurance).

Common terminology to recognize:
- Insurance types: "life", "health", "auto", "home", "business", "disability", "long-term care"
- Coverage amounts: dollar amounts for policies
- Current status: "no coverage", "have coverage", "looking to add", "switching"
- Age info: age ranges affect pricing
- Health: health status, pre-existing conditions, smoking status
- Timeline: urgency of coverage need

Examples of what you might see:
- "Family of 4, need $500k life insurance, both parents mid-30s, non-smokers, good health, want quotes ASAP"
- "Small business owner, 15 employees, need business insurance package, current policy expiring next month"`,

      SOLAR_ENERGY: `You are extracting leads for SOLAR ENERGY (solar panel installation, renewable energy).

Common terminology to recognize:
- Property types: residential, commercial, agricultural, industrial
- Electric bill: monthly electricity costs indicate system size needed
- Motivation: "save money", "environment", "energy independence", "tax incentives"
- Roof info: roof condition, age, replacement needs
- Ownership: own vs rent, landlord approval
- Financing: "cash", "loan", "lease", "PPA"
- Timeline: readiness to install

Examples of what you might see:
- "Homeowner, $300/month electric bill, want to go solar to save money, roof 5 years old, good condition, interested in financing options"
- "Business owner, commercial building, $2k/month electric, want tax incentives, ready to install this quarter, cash purchase"`
    };

    const sectorContext = sectorContexts[businessSector] || `You are a lead information extraction assistant for ${businessSector || 'GENERAL'} business.`;

    const prompt = `${sectorContext}

Extract these COMMON fields (if present in the text):
- fullName: Full name of the lead/contact person [REQUIRED]
- company: Company or organization name (mainly for B2B leads, optional for B2C)
- title: Job title or position (mainly for B2B leads, optional for B2C homeowners/consumers)
- email: Email address
- phone: Phone number (extract just numbers and format)
- linkedinUrl: LinkedIn profile URL
- source: Where the lead came from (e.g., LinkedIn, Website, Referral, Cold Call, Facebook, Google)

NOTE: For B2C sectors (HOME_SERVICES, HEALTHCARE, AUTOMOTIVE, REAL_ESTATE, etc.), company and title are often not applicable. For example, a homeowner needing HVAC repair does not have a "company" or "title" - simply omit these fields if not present.

Extract these INDUSTRY-SPECIFIC custom fields (if present in the text):
${customFieldsDescription}

Input Text:
${text}

INSTRUCTIONS:
1. Extract ONLY information that is explicitly stated or clearly implied in the text
2. For missing fields, omit them from the response entirely
3. For select/dropdown fields, you MUST choose one of the provided options - find the best match:
   - For budget/price ranges: map the stated amount to the closest range (e.g., "$8,000-$12,000" -> "$5,000 - $15,000")
   - For urgency: interpret contextual clues ("urgent", "ASAP", "this week" -> "Emergency/Urgent")
   - For service types: match similar terms to the closest option
4. For date fields, format as YYYY-MM-DD
5. For number fields, extract numeric values only (remove $ signs, commas)
6. Be smart about variations and context clues
7. Pay attention to the business sector context and terminology above
8. If the text mentions urgency or timeline, extract that information
9. Look for budget/price information and map it to the appropriate range option
10. CRITICAL: Never return a value that is not in the provided options list for select fields

Return ONLY valid JSON in this EXACT format (no markdown, no code blocks, no explanations):
{
  "commonFields": {
    "fullName": "string",
    "company": "string",
    "title": "string",
    "email": "string",
    "phone": "string",
    "linkedinUrl": "string",
    "source": "string"
  },
  "customFields": {
    // Include only the industry-specific fields found in the text
  }
}`;

    // Validate API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service not configured. Please add OPENROUTER_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    // Call OpenRouter API with configured model
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'LeadGenFlow AI',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent extraction
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { error: { message: errorText } };
      }

      console.error('OpenRouter API error:', errorJson);

      // Provide helpful error messages
      const errorMessage = errorJson.error?.message || 'Unknown error';
      if (errorMessage.includes('ignored')) {
        return NextResponse.json(
          {
            error: 'AI provider configuration error. Please visit https://openrouter.ai/settings/preferences and ensure Anthropic is not in your ignored providers list.',
            details: errorMessage
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to parse lead information',
          details: errorMessage
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse the JSON response from Claude
    let parsed;
    try {
      // Try to extract JSON if Claude wrapped it in markdown code blocks
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Clean up null values from commonFields
    if (parsed.commonFields) {
      Object.keys(parsed.commonFields).forEach(key => {
        if (parsed.commonFields[key] === null || parsed.commonFields[key] === 'null') {
          delete parsed.commonFields[key];
        }
      });
    }

    // Clean up null values from customFields
    if (parsed.customFields) {
      Object.keys(parsed.customFields).forEach(key => {
        if (parsed.customFields[key] === null || parsed.customFields[key] === 'null') {
          delete parsed.customFields[key];
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error parsing lead:', error);
    return NextResponse.json(
      { error: 'Failed to parse lead information' },
      { status: 500 }
    );
  }
}
