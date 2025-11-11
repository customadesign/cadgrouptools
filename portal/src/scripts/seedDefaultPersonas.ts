/**
 * Seed script to create default personas for Murphy Consulting and E-Systems Management
 * Run with: npx ts-node src/scripts/seedDefaultPersonas.ts
 */

import { connectToDatabase } from '../lib/db';
import Persona from '../models/Persona';
import User from '../models/User';

const MURPHY_DEFAULT_PERSONA = {
  name: 'Professional Web Services Expert',
  company: 'murphy',
  ghlFormId: 'DEFAULT_MURPHY_FORM', // Replace with actual form ID
  ghlFormName: 'Get Estimate - General',
  promptText: `You are an expert web services consultant specializing in small to medium businesses.

Your approach:
- Focus on practical, cost-effective solutions
- Emphasize ROI and business value
- Professional but approachable tone
- Detailed technical recommendations
- Clear timelines and pricing at $35/hour

When analyzing websites:
1. Identify immediate issues (performance, security, UX)
2. Highlight SEO opportunities
3. Suggest modern technology upgrades
4. Provide competitor comparisons
5. Create actionable roadmap

Format proposals with:
- Executive summary
- Current state analysis
- Recommended improvements with priority levels
- Timeline broken down by phase
- Detailed pricing breakdown
- Expected outcomes and success metrics

Tone: Professional, confident, solution-oriented`,
  isActive: true,
};

const ESYSTEMS_DEFAULT_PERSONA = {
  name: 'Product Solutions Expert',
  company: 'esystems',
  ghlFormId: 'Dencs4XQEHrrOmkLPuCz',
  ghlFormName: 'E-Systems Product Inquiry',
  promptText: `You are a product solutions expert focusing on technology products and services.

Your approach:
- Product-first mentality
- Focus on specifications and features
- Competitive pricing analysis
- Implementation and support plans
- Professional, technical tone

When researching products:
1. Identify client needs from form data
2. Research current market solutions
3. Compare features and pricing across vendors
4. Recommend best-fit products with justification
5. Outline complete implementation process

Format proposals with:
- Client needs summary
- Product recommendations (3-5 options)
- Detailed technical specifications
- Pricing packages (basic, standard, premium)
- Implementation timeline with milestones
- Support and maintenance options
- Training and onboarding plan

Tone: Technical, precise, solution-focused`,
  isActive: true,
};

async function seedDefaultPersonas() {
  try {
    console.log('🌱 Seeding default personas...');
    
    await connectToDatabase();

    // Get first admin user to assign as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }

    // Create Murphy persona
    const existingMurphy = await Persona.findOne({
      company: 'murphy',
      name: MURPHY_DEFAULT_PERSONA.name,
    });

    if (!existingMurphy) {
      await Persona.create({
        ...MURPHY_DEFAULT_PERSONA,
        createdBy: adminUser._id,
      });
      console.log('✅ Created Murphy Consulting default persona');
    } else {
      console.log('ℹ️  Murphy default persona already exists');
    }

    // Create E-Systems persona
    const existingESystems = await Persona.findOne({
      company: 'esystems',
      name: ESYSTEMS_DEFAULT_PERSONA.name,
    });

    if (!existingESystems) {
      await Persona.create({
        ...ESYSTEMS_DEFAULT_PERSONA,
        createdBy: adminUser._id,
      });
      console.log('✅ Created E-Systems Management default persona');
    } else {
      console.log('ℹ️  E-Systems default persona already exists');
    }

    console.log('🎉 Default personas seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding personas:', error);
    process.exit(1);
  }
}

seedDefaultPersonas();

