require('dotenv').config();
const supabase = require('./utils/supabase');

const SEED_POSTS = [
  {
    title: 'Movement: Shout from the mountaintop',
    week_number: 1,
    image_emoji: '🏔️',
    scheduled_date: '2026-05-15T12:00:00-04:00',
    status: 'scheduled',
    engagement_prediction: 78,
    variants: [
      { variant_label: 'Direct', caption_text: 'This isn\'t a trend. It\'s a movement. When you build sovereign infrastructure, you don\'t whisper — you shout from the mountaintop. 🏔️\n\n#SovereignTech #BuildYourOwn #CNY #CANNIBUS #DigitalSovereignty' },
      { variant_label: 'Storytelling', caption_text: 'They told us to wait our turn. To follow the playbook. To ask permission.\n\nWe built our own mountaintop instead. 🏔️\n\nThis is what sovereign infrastructure looks like when you stop asking and start building.\n\n#Movement #OwnYourFuture #CNY' },
      { variant_label: 'Challenge', caption_text: 'Still waiting for someone to give you a platform? 🏔️\n\nBuild. Your. Own.\n\nEvery tool. Every system. Every advantage. From scratch.\n\nWho\'s ready to stop renting and start owning?\n\n#BuildDontRent #SovereignTech #CANNIBUS' },
    ],
  },
  {
    title: 'Live deployment proof: CardSync Pro',
    week_number: 1,
    image_emoji: '🚀',
    scheduled_date: '2026-05-18T14:00:00-04:00',
    status: 'scheduled',
    engagement_prediction: 85,
    variants: [
      { variant_label: 'Direct', caption_text: 'CardSync Pro is LIVE. Real inventory tracking. Real market values. Real profit calculations. Not a mockup — deployed and running. 🚀\n\n#CardSyncPro #TCG #LiveDeployment #BuildInPublic' },
      { variant_label: 'Storytelling', caption_text: 'From concept to production in 48 hours. CardSync Pro tracks every card, every sale, every profit margin — automatically. 🚀\n\nThis is what happens when you stop planning and start shipping.\n\n#CardSyncPro #ShipIt #TCG' },
      { variant_label: 'Challenge', caption_text: 'Your card collection is worth more than you think. But are you tracking it? 🚀\n\nCardSync Pro: real-time inventory, market values, profit tracking. All automated.\n\nStop guessing. Start knowing.\n\n#CardSyncPro #TCG #KnowYourValue' },
    ],
  },
  {
    title: 'Technician vs. Architect breakdown',
    week_number: 2,
    image_emoji: '🏗️',
    scheduled_date: '2026-05-22T12:00:00-04:00',
    status: 'scheduled',
    engagement_prediction: 72,
    variants: [
      { variant_label: 'Direct', caption_text: 'Technicians fix things. Architects build systems that don\'t break. 🏗️\n\nWhich one are you building your business as?\n\n#Architect #SystemsThinking #BusinessStrategy #CNY' },
      { variant_label: 'Storytelling', caption_text: 'I used to fix every problem myself. Every bug. Every client issue. Every emergency.\n\nThen I learned the difference between being a technician and being an architect. 🏗️\n\nArchitects build systems. Technicians maintain them. The gap between the two is where empires are built.\n\n#LevelUp #BusinessArchitect' },
      { variant_label: 'Challenge', caption_text: 'Quick test: Are you the one doing the work, or did you build the system that does the work? 🏗️\n\nIf you disappeared for 30 days, would your business survive?\n\nThat\'s the technician vs. architect gap.\n\n#SystemsOverHustle #BuildSmart' },
    ],
  },
  {
    title: 'Empire at 65: The response',
    week_number: 2,
    image_emoji: '👑',
    scheduled_date: '2026-05-25T14:00:00-04:00',
    status: 'scheduled',
    engagement_prediction: 90,
    variants: [
      { variant_label: 'Direct', caption_text: 'They said it was too late. At 65, most people are winding down. We\'re just getting started. 👑\n\nAge is not a limitation — it\'s leverage. Decades of experience + modern tools = unstoppable.\n\n#NeverTooLate #Empire #Legacy' },
      { variant_label: 'Storytelling', caption_text: 'Someone commented: "You\'re building all this at 65?"\n\nYes. With AI. With sovereignty. With 40 years of business experience that no 25-year-old startup founder has. 👑\n\nExperience isn\'t obsolete. It\'s the unfair advantage.\n\n#WisdomMeetstech #Legacy' },
      { variant_label: 'Challenge', caption_text: 'Think you\'re too old to build a tech empire? 👑\n\nAt 65, we\'re deploying AI systems, building SaaS platforms, and automating what took corporations millions.\n\nWhat\'s your excuse?\n\n#NoExcuses #AgelessAmbition #BuildAtAnyAge' },
    ],
  },
  {
    title: 'The CANNIBUS truck origin story',
    week_number: 3,
    image_emoji: '🚛',
    scheduled_date: '2026-05-29T12:00:00-04:00',
    status: 'scheduled',
    engagement_prediction: 82,
    variants: [
      { variant_label: 'Direct', caption_text: 'Before the tech. Before the AI. There was a truck. 🚛\n\nThe CANNIBUS truck is where it all started — real product, real customers, real hustle. That foundation is why everything we build now actually works.\n\n#Origins #CANNIBUS #RealBusiness' },
      { variant_label: 'Storytelling', caption_text: 'The first dollar didn\'t come from a SaaS subscription. It came from the window of a truck. 🚛\n\nCANNIBUS started on the streets of New Paltz. Every system we build today is rooted in that experience — serving real people, in real time.\n\n#OriginStory #StreetToSaaS' },
      { variant_label: 'Challenge', caption_text: 'Everyone wants to build the next big app. But can you run a truck? 🚛\n\nBefore you automate, you need to understand the grind. The CANNIBUS truck taught us everything code never could.\n\nRespect the foundation.\n\n#FoundationFirst #CANNIBUS' },
    ],
  },
  {
    title: 'Why CNY LLC matters beyond Main Street',
    week_number: 3,
    image_emoji: '🏢',
    scheduled_date: '2026-06-01T14:00:00-04:00',
    status: 'scheduled',
    engagement_prediction: 68,
    variants: [
      { variant_label: 'Direct', caption_text: '56 Main Street isn\'t just an address. It\'s a statement. 🏢\n\nCNY LLC represents what happens when a local business thinks globally while acting locally. Physical presence + digital infrastructure = complete sovereignty.\n\n#CNY #MainStreet #LocalGlobal' },
      { variant_label: 'Storytelling', caption_text: 'When we signed the lease at 56 Main Street, people saw a storefront. We saw a launchpad. 🏢\n\nEvery system we deploy — GENESIS, CardSync, Credit Genie — has roots in this building. Main Street is where digital meets physical.\n\n#NewPaltz #CNY #Launchpad' },
      { variant_label: 'Challenge', caption_text: 'Why does a tech company need a physical address? 🏢\n\nBecause sovereignty isn\'t just digital. It\'s owning the space, the brand, and the presence. 56 Main Street is proof that we\'re not just online — we\'re HERE.\n\n#OwnYourSpace #CNY' },
    ],
  },
  {
    title: 'Digital sovereignty in action',
    week_number: 4,
    image_emoji: '🛡️',
    scheduled_date: '2026-06-05T12:00:00-04:00',
    status: 'scheduled',
    engagement_prediction: 76,
    variants: [
      { variant_label: 'Direct', caption_text: 'Digital sovereignty means you own every piece of your tech stack. 🛡️\n\nNo rented platforms. No subscription dependencies. No asking permission.\n\nGENESIS OS. CardSync Pro. Credit Genie. PostFlow AI. All ours.\n\n#DigitalSovereignty #OwnYourStack' },
      { variant_label: 'Storytelling', caption_text: 'Last month, a major platform changed their API pricing. Thousands of businesses panicked. 🛡️\n\nWe didn\'t even flinch. Because we don\'t rent our infrastructure — we own it.\n\nThat\'s digital sovereignty in action.\n\n#SovereignTech #NoRentals' },
      { variant_label: 'Challenge', caption_text: 'How many of your business tools could disappear tomorrow if a company changes their pricing? 🛡️\n\nDigital sovereignty = owning your code, your data, your infrastructure.\n\nStop renting. Start owning.\n\n#OwnDontRent #DigitalSovereignty' },
    ],
  },
  {
    title: 'The directive: Build your own',
    week_number: 4,
    image_emoji: '⚡',
    scheduled_date: '2026-06-08T14:00:00-04:00',
    status: 'scheduled',
    engagement_prediction: 88,
    variants: [
      { variant_label: 'Direct', caption_text: 'The directive is simple: Build your own. ⚡\n\nYour own tools. Your own platform. Your own revenue streams. Your own empire.\n\nNobody is coming to save your business. But the tools to save it yourself have never been more accessible.\n\n#BuildYourOwn #TheDirective' },
      { variant_label: 'Storytelling', caption_text: 'Six months ago, we had an idea. Today, we have an ecosystem. ⚡\n\nGENESIS builds websites. CardSync tracks inventory. Credit Genie fights for your credit. PostFlow automates your voice.\n\nAll built. All owned. All sovereign.\n\nThe directive was always: Build your own.\n\n#Ecosystem #BuildYourOwn' },
      { variant_label: 'Challenge', caption_text: 'Here\'s the directive: ⚡\n\nStop scrolling and start building. Stop subscribing and start owning. Stop waiting and start shipping.\n\nThe tools exist. The AI exists. The only thing missing is your decision to start.\n\nWhat are you building today?\n\n#TheDirective #StartNow #BuildYourOwn' },
    ],
  },
];

async function seed() {
  console.log('Seeding PostFlow AI database…');

  for (const postData of SEED_POSTS) {
    const { variants, ...post } = postData;

    // Insert post
    const { data: inserted, error: postErr } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single();

    if (postErr) {
      console.error(`Failed to insert post "${post.title}":`, postErr.message);
      continue;
    }

    console.log(`✓ Post: ${inserted.title} (${inserted.id})`);

    // Insert variants
    if (variants && variants.length > 0) {
      const variantRows = variants.map((v) => ({
        post_id: inserted.id,
        variant_label: v.variant_label,
        caption_text: v.caption_text,
      }));

      const { error: varErr } = await supabase
        .from('caption_variants')
        .insert(variantRows);

      if (varErr) {
        console.error(`  Failed to insert variants:`, varErr.message);
      } else {
        console.log(`  ✓ ${variants.length} caption variants added`);
      }
    }
  }

  console.log('\nSeeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
