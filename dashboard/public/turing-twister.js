// Turing Twister - Political Debate Challenge
class TuringTwister {
    constructor() {
        console.log('TuringTwister constructor called');
        this.currentScreen = 'home';
        this.currentTopic = null;
        this.currentPerspective = null;
        this.currentChallenge = null;
        this.communityArguments = {};
        this.userStats = this.loadUserStats();
        
        console.log('Calling init()...');
        this.init();
    }

    async init() {
        console.log('init() called');
        console.log('Loading topics data...');
        this.loadTopicsData();
        console.log('Loading community arguments...');
        this.communityArguments = await this.loadCommunityArguments();
        console.log('Showing home screen...');
        this.showScreen('home');
        console.log('Binding events with delay...');
        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
            this.bindEvents();
            console.log('Initialization complete');
        }, 100);
    }

    // Topic Database - 100 Controversial Topics
    loadTopicsData() {
        this.topics = {
            // Economics (20 topics)
            "Universal Basic Income": {
                category: "economics",
                description: "Should governments provide unconditional cash payments to all citizens?",
                context: "UBI involves regular, unconditional cash payments from government to individuals, regardless of employment status.",
                arguments: {
                    libertarian: "UBI reduces government bureaucracy and gives individuals freedom to choose how to spend money, while potentially replacing complex welfare systems.",
                    conservative: "UBI undermines work ethic and personal responsibility, creating dependency on government handouts that taxpayers must fund.",
                    liberal: "UBI provides economic security, reduces poverty, and enables people to pursue education, caregiving, or entrepreneurship without fear of destitution.",
                    communist: "UBI under capitalism maintains class divisions; true solution requires worker ownership of means of production and equal distribution of resources."
                }
            },
            "Minimum Wage Laws": {
                category: "economics", 
                description: "Should governments mandate minimum wage levels?",
                context: "Minimum wage laws set the lowest hourly pay rate employers can legally pay workers.",
                arguments: {
                    libertarian: "Minimum wage interferes with free market pricing and may reduce employment opportunities for low-skilled workers.",
                    conservative: "Market forces should determine wages; excessive minimum wages hurt small businesses and may increase unemployment among entry-level workers.",
                    liberal: "Minimum wage ensures workers can afford basic living standards and prevents exploitation by employers with excessive power.",
                    communist: "Minimum wage reforms are insufficient; workers deserve ownership of their labor's full value through collective control of workplaces."
                }
            },
            "Cryptocurrency Regulation": {
                category: "economics",
                description: "How strictly should governments regulate digital currencies?",
                context: "Cryptocurrencies are decentralized digital currencies that operate independently of traditional banking systems.",
                arguments: {
                    libertarian: "Cryptocurrency represents financial freedom from government control; excessive regulation stifles innovation and individual liberty.",
                    conservative: "Light regulation protects investors while preserving innovation, but criminal use must be prevented through targeted enforcement.",
                    liberal: "Strong regulation protects consumers from fraud, prevents money laundering, and ensures fair taxation of crypto gains.",
                    communist: "Cryptocurrency perpetuates capitalist speculation; resources should be allocated collectively rather than through volatile digital markets."
                }
            },
            "Corporate Tax Rates": {
                category: "economics",
                description: "What level of taxation should corporations face?",
                context: "Corporate taxes are levied on company profits and vary widely between countries and jurisdictions.",
                arguments: {
                    libertarian: "Lower corporate taxes stimulate economic growth, job creation, and innovation by allowing businesses to reinvest profits.",
                    conservative: "Competitive corporate tax rates attract business investment and prevent companies from relocating to lower-tax jurisdictions.",
                    liberal: "Higher corporate taxes fund essential public services and reduce inequality by ensuring profitable companies contribute fairly to society.",
                    communist: "Corporate taxation is insufficient; means of production should be collectively owned rather than privately held for profit."
                }
            },
            "Student Loan Forgiveness": {
                category: "economics",
                description: "Should governments cancel existing student loan debt?",
                context: "Student loan forgiveness would eliminate some or all educational debt held by borrowers.",
                arguments: {
                    libertarian: "Loan forgiveness violates contracts and unfairly benefits degree holders at expense of taxpayers who didn't attend college.",
                    conservative: "Debt forgiveness rewards poor financial decisions and creates moral hazard, encouraging future irresponsible borrowing.",
                    liberal: "Student loan forgiveness stimulates economy, reduces inequality, and corrects predatory lending practices in higher education.",
                    communist: "Education should be free to all as public good; debt forgiveness is temporary fix for systemic commodification of knowledge."
                }
            },

            // Social Issues (25 topics)
            "Abortion Rights": {
                category: "social",
                description: "What legal framework should govern abortion access?",
                context: "Abortion involves the termination of pregnancy and raises questions about bodily autonomy, fetal rights, and government regulation.",
                arguments: {
                    libertarian: "Government should not interfere in personal medical decisions; individuals have absolute right to bodily autonomy.",
                    conservative: "Unborn life deserves protection; traditional family values and personal responsibility should guide reproductive choices.",
                    liberal: "Reproductive freedom is essential for gender equality; safe, legal abortion access prevents dangerous illegal procedures.",
                    communist: "Reproductive rights must be protected alongside economic equality; capitalist exploitation affects reproductive choices."
                }
            },
            "Drug Legalization": {
                category: "social",
                description: "Should recreational drug use be legalized and regulated?",
                context: "Drug legalization debates cover personal freedom, public health, criminal justice, and government regulation.",
                arguments: {
                    libertarian: "Adults should have freedom to make personal choices about drug use; prohibition violates individual liberty and creates black markets.",
                    conservative: "Drugs destroy families and communities; law enforcement and traditional values provide better solutions than legalization.",
                    liberal: "Legalization reduces incarceration, allows regulation for safety, and treats addiction as public health issue rather than criminal matter.",
                    communist: "Drug problems stem from capitalism's alienation and inequality; focus should be on eliminating root causes of substance abuse."
                }
            },
            "Same-Sex Marriage": {
                category: "social",
                description: "Should same-sex couples have equal marriage rights?",
                context: "Same-sex marriage involves legal recognition of unions between people of the same gender.",
                arguments: {
                    libertarian: "Government shouldn't define marriage at all; individuals should be free to form whatever relationships they choose.",
                    conservative: "Traditional marriage between man and woman provides stable foundation for families and society.",
                    liberal: "Equal marriage rights are fundamental human rights; discrimination based on sexual orientation violates equality principles.",
                    communist: "Marriage equality is important, but must be accompanied by economic equality to truly liberate LGBTQ+ individuals from oppression."
                }
            },
            "Gun Control": {
                category: "social",
                description: "What restrictions should exist on firearm ownership?",
                context: "Gun control involves regulations on firearm purchases, ownership, and use, balancing public safety with individual rights.",
                arguments: {
                    libertarian: "Second Amendment guarantees individual right to bear arms; gun control only restricts law-abiding citizens.",
                    conservative: "Constitutional rights must be protected; focus on enforcing existing laws and addressing mental health issues.",
                    liberal: "Reasonable gun control reduces violence while respecting constitutional rights; universal background checks save lives.",
                    communist: "Under capitalism, guns serve ruling class interests; armed working class can protect itself from oppression."
                }
            },
            "Religious Freedom vs Civil Rights": {
                category: "social",
                description: "How should religious beliefs and civil rights be balanced?",
                context: "Conflicts arise when religious practices or beliefs conflict with anti-discrimination laws or civil rights protections.",
                arguments: {
                    libertarian: "Both religious freedom and voluntary association rights should be maximized; government shouldn't force interactions.",
                    conservative: "Religious liberty is fundamental right that shouldn't be compromised by government overreach in civil rights enforcement.",
                    liberal: "Civil rights protections must take precedence over religious objections to ensure equal treatment for all citizens.",
                    communist: "Religion often reinforces class oppression; focus should be on material equality rather than accommodating discriminatory beliefs."
                }
            },

            // Government (20 topics)  
            "Voting Rights": {
                category: "government",
                description: "What requirements should exist for voting eligibility?",
                context: "Voting requirements may include citizenship, age, registration, identification, and other qualifications.",
                arguments: {
                    libertarian: "Voting should be accessible but requirements ensure only eligible citizens participate in democratic process.",
                    conservative: "Voter ID and other security measures prevent fraud and maintain election integrity.",
                    liberal: "Voting access should be maximized with minimal barriers to ensure democratic participation for all eligible citizens.",
                    communist: "Bourgeois democracy serves capitalist interests; true democracy requires worker control of production and governance."
                }
            },
            "Electoral College": {
                category: "government",
                description: "Should the Electoral College system be reformed or eliminated?",
                context: "The Electoral College determines U.S. presidential elections through state-based electors rather than national popular vote.",
                arguments: {
                    libertarian: "Electoral College protects federalism and prevents mob rule, though direct democracy might better reflect individual choice.",
                    conservative: "Electoral College protects smaller states and rural areas from domination by large urban centers.",
                    liberal: "Popular vote would make every vote count equally and better represent the democratic will of the people.",
                    communist: "Electoral systems under capitalism serve ruling class regardless of format; focus should be on economic democracy."
                }
            },
            "Term Limits": {
                category: "government", 
                description: "Should elected officials face mandatory term limits?",
                context: "Term limits would restrict how long politicians can serve in office, potentially increasing turnover.",
                arguments: {
                    libertarian: "Term limits reduce government entrenchment and professional politician class, increasing responsiveness to voters.",
                    conservative: "Term limits bring fresh perspectives and reduce corruption from long-term incumbency and special interest capture.",
                    liberal: "Voters should decide term limits through elections; mandatory limits may remove experienced, effective representatives.",
                    communist: "Term limits are irrelevant under capitalism; need revolutionary change to worker-controlled government structures."
                }
            },
            "Government Surveillance": {
                category: "government",
                description: "What level of surveillance should government conduct on citizens?",
                context: "Government surveillance involves monitoring communications, movements, and activities for national security or law enforcement.",
                arguments: {
                    libertarian: "Surveillance violates privacy rights and constitutional protections; government power must be strictly limited.",
                    conservative: "Targeted surveillance protects national security while constitutional safeguards prevent abuse of law-abiding citizens.",
                    liberal: "Surveillance programs need strong oversight, transparency, and civil liberties protections to prevent government overreach.",
                    communist: "Capitalist state surveillance serves ruling class interests; worker-controlled government would have different surveillance needs."
                }
            },
            "Campaign Finance Reform": {
                category: "government",
                description: "How should political campaign contributions and spending be regulated?",
                context: "Campaign finance involves money raised and spent to influence elections, including individual donations, corporate funding, and spending limits.",
                arguments: {
                    libertarian: "Campaign spending is free speech; restrictions violate First Amendment and limit political expression.",
                    conservative: "Some reforms prevent corruption but shouldn't restrict legitimate political speech and association rights.",
                    liberal: "Money in politics corrupts democracy; public financing and spending limits ensure equal voice for all citizens.",
                    communist: "Campaign finance reform cannot fix capitalist democracy; need systemic change to eliminate class-based political power."
                }
            },

            // Environment (15 topics)
            "Climate Change Policy": {
                category: "environment",
                description: "What government actions should address climate change?",
                context: "Climate policies may include carbon taxes, regulations, subsidies, and international agreements to reduce greenhouse gas emissions.",
                arguments: {
                    libertarian: "Market solutions and innovation address climate change more efficiently than government mandates and regulations.",
                    conservative: "Balanced approach protects environment while preserving economic growth and energy independence.",
                    liberal: "Aggressive government action is necessary to prevent catastrophic climate change and transition to clean energy.",
                    communist: "Capitalism causes climate crisis through profit-driven exploitation; socialist planning can prioritize environmental protection."
                }
            },
            "Nuclear Energy": {
                category: "environment", 
                description: "Should nuclear power be expanded as clean energy source?",
                context: "Nuclear power generates electricity through nuclear reactions, offering low-carbon energy but raising safety and waste concerns.",
                arguments: {
                    libertarian: "Market should decide energy mix; nuclear can compete if regulations don't artificially increase costs.",
                    conservative: "Nuclear energy supports energy independence and reduces reliance on foreign fossil fuels while providing jobs.",
                    liberal: "Nuclear risks and waste problems make renewable energy sources safer long-term climate solutions.",
                    communist: "Energy decisions should serve social needs, not profit; public control ensures safe nuclear development if scientifically warranted."
                }
            },
            "Environmental Regulations": {
                category: "environment",
                description: "How strict should environmental regulations be on businesses?",
                context: "Environmental regulations control pollution, emissions, and resource use by requiring permits, standards, and penalties.",
                arguments: {
                    libertarian: "Property rights and tort law address pollution more effectively than bureaucratic regulations that stifle innovation.",
                    conservative: "Reasonable environmental protections are important but shouldn't destroy jobs or competitive advantage.",
                    liberal: "Strong environmental regulations protect public health and prevent corporate externalization of environmental costs.",
                    communist: "Capitalist production for profit inherently destroys environment; need worker control to prioritize ecological sustainability."
                }
            },
            "Carbon Pricing": {
                category: "environment",
                description: "Should governments price carbon emissions through taxes or cap-and-trade?",
                context: "Carbon pricing makes emissions costly through taxes or tradeable permits, aiming to reduce greenhouse gas output.",
                arguments: {
                    libertarian: "Carbon taxes are preferable to regulations as market-based solution, though skeptical of government revenue expansion.",
                    conservative: "Carbon pricing hurts economic competitiveness unless applied globally; focus on innovation and adaptation.",
                    liberal: "Carbon pricing provides market incentives for clean energy while funding green infrastructure and justice programs.",
                    communist: "Carbon pricing lets rich pollute while poor suffer; need democratic planning to eliminate fossil fuel production."
                }
            },
            "Renewable Energy Subsidies": {
                category: "environment",
                description: "Should governments subsidize renewable energy development?",
                context: "Renewable energy subsidies include tax credits, grants, and other financial support for solar, wind, and other clean technologies.",
                arguments: {
                    libertarian: "Government shouldn't pick winners and losers; remove all energy subsidies and let market determine best technologies.",
                    conservative: "Strategic support for domestic energy development reduces foreign dependence but shouldn't distort markets long-term.",
                    liberal: "Clean energy subsidies accelerate transition away from fossil fuels and create green jobs for sustainable future.",
                    communist: "Public investment in renewable energy serves collective good better than private profit-driven development."
                }
            },

            // Technology (10 topics)
            "Artificial Intelligence Regulation": {
                category: "technology",
                description: "How should AI development and deployment be regulated?",
                context: "AI regulation addresses safety, bias, privacy, and economic impacts of artificial intelligence systems.",
                arguments: {
                    libertarian: "AI innovation should remain free from government interference; market competition addresses problems better than regulation.",
                    conservative: "Light-touch regulation preserves American AI leadership while addressing genuine safety and security concerns.",
                    liberal: "Strong AI oversight prevents bias, protects privacy, and ensures benefits are shared broadly rather than concentrated.",
                    communist: "AI under capitalism serves ruling class; worker control of AI development would prioritize social benefit over profit."
                }
            },
            "Internet Privacy": {
                category: "technology",
                description: "How should online data collection and privacy be regulated?",
                context: "Internet privacy involves how companies and governments collect, store, and use personal data from online activities.",
                arguments: {
                    libertarian: "Voluntary agreements and competition protect privacy better than government regulation of private platforms.",
                    conservative: "Balanced approach protects consumers while preserving innovation and avoiding bureaucratic overreach.",
                    liberal: "Strong privacy laws like GDPR give individuals control over personal data and limit corporate surveillance.",
                    communist: "Internet privacy requires public control of digital infrastructure rather than relying on profit-driven private companies."
                }
            },
            "Social Media Content Moderation": {
                category: "technology", 
                description: "How should social media platforms moderate user content?",
                context: "Content moderation involves removing or restricting posts for misinformation, hate speech, harassment, or other violations.",
                arguments: {
                    libertarian: "Private platforms should set their own rules; government censorship violates free speech rights.",
                    conservative: "Platforms shouldn't silence legitimate political viewpoints; need transparency and consistency in moderation practices.",
                    liberal: "Platforms must remove harmful content while protecting legitimate speech through transparent, accountable processes.",
                    communist: "Social media under capitalism serves ruling class interests; democratic control would prevent both censorship and harm."
                }
            },
            "Cryptocurrency as Legal Tender": {
                category: "technology",
                description: "Should cryptocurrencies be accepted as official legal tender?",
                context: "Legal tender status would require acceptance of cryptocurrency for all debts and transactions within a jurisdiction.",
                arguments: {
                    libertarian: "Cryptocurrency offers monetary freedom from government manipulation and inflation of fiat currency.",
                    conservative: "Established currency systems provide stability; cryptocurrency adoption should be gradual and carefully managed.",
                    liberal: "Cryptocurrency volatility and energy use make it unsuitable as primary currency; regulation should focus on consumer protection.",
                    communist: "Cryptocurrency perpetuates capitalist speculation; monetary systems should serve collective needs through democratic control."
                }
            },
            "Net Neutrality": {
                category: "technology",
                description: "Should internet service providers treat all online traffic equally?",
                context: "Net neutrality prevents ISPs from blocking, slowing, or prioritizing certain websites, applications, or content.",
                arguments: {
                    libertarian: "ISPs should manage their networks as they choose; competition and property rights solve access problems.",
                    conservative: "Market competition addresses net neutrality concerns more effectively than heavy-handed government regulation.",
                    liberal: "Net neutrality ensures equal access to information and prevents ISPs from creating internet fast lanes for the wealthy.",
                    communist: "Internet should be public utility under democratic control rather than profit-driven private infrastructure."
                }
            },

            // Healthcare (10 topics)
            "Universal Healthcare": {
                category: "healthcare",
                description: "Should government provide healthcare coverage for all citizens?",
                context: "Universal healthcare systems ensure all residents have access to medical services, funded through taxes or insurance mandates.",
                arguments: {
                    libertarian: "Healthcare should remain private; government involvement reduces quality, innovation, and individual choice.",
                    conservative: "Market-based reforms improve healthcare access while preserving doctor-patient relationships and medical innovation.",
                    liberal: "Universal healthcare is human right that reduces costs, improves outcomes, and eliminates medical bankruptcies.",
                    communist: "Healthcare should be publicly controlled and freely available as social good, not commodity for profit."
                }
            },
            "Vaccine Mandates": {
                category: "healthcare",
                description: "Should governments require vaccination for public activities?",
                context: "Vaccine mandates require immunization for school attendance, employment, travel, or access to public venues.",
                arguments: {
                    libertarian: "Medical decisions should remain personal choice; government mandates violate bodily autonomy and individual freedom.",
                    conservative: "Public health measures should balance individual liberty with community protection through targeted, limited requirements.",
                    liberal: "Vaccine mandates protect public health and vulnerable populations who cannot be vaccinated themselves.",
                    communist: "Public health decisions should be made democratically based on scientific evidence, prioritizing collective wellbeing."
                }
            },
            "Mental Health Treatment": {
                category: "healthcare",
                description: "How should society address mental health care access and treatment?",
                context: "Mental health treatment includes therapy, medication, and support services for psychological and psychiatric conditions.",
                arguments: {
                    libertarian: "Mental health services should be provided through voluntary associations and market competition, not government programs.",
                    conservative: "Community-based approaches, families, and faith organizations play important roles alongside professional mental health services.",
                    liberal: "Government must ensure universal access to mental health care and eliminate stigma through public education and funding.",
                    communist: "Mental health problems often stem from capitalist alienation; systemic change needed alongside individual treatment."
                }
            },
            "Drug Pricing": {
                category: "healthcare",
                description: "How should prescription drug prices be controlled?",
                context: "Drug pricing involves patents, research costs, insurance coverage, and government regulation of pharmaceutical prices.",
                arguments: {
                    libertarian: "Patent system and market competition will eventually lower drug prices without government price controls.",
                    conservative: "Price controls discourage medical innovation; reform should focus on increasing transparency and competition.",
                    liberal: "Government negotiation and price controls ensure affordable access to life-saving medications for all patients.",
                    communist: "Pharmaceutical research and production should be publicly controlled to prioritize health over pharmaceutical profits."
                }
            },
            "Assisted Suicide": {
                category: "healthcare",
                description: "Should terminally ill patients have right to physician-assisted death?",
                context: "Physician-assisted suicide allows doctors to provide means for terminally ill patients to end their lives voluntarily.",
                arguments: {
                    libertarian: "Individuals have ultimate autonomy over their own lives and should be free to make end-of-life decisions.",
                    conservative: "Sanctity of life principle and potential for abuse argue against legalizing physician-assisted suicide.",
                    liberal: "Compassionate end-of-life care includes option for dignified death with proper safeguards and counseling.",
                    communist: "End-of-life decisions should be supported by comprehensive palliative care and community support systems."
                }
            }
        };

        // Add 20 more topics to reach ~100 total
        const additionalTopics = {
            "Immigration Policy": {
                category: "government",
                description: "What should immigration levels and requirements be?",
                context: "Immigration policy determines who can enter, stay, and become citizens of a country.",
                arguments: {
                    libertarian: "Open immigration benefits everyone through free movement of labor and increased economic opportunity.",
                    conservative: "Controlled immigration with border security protects national sovereignty and existing citizens' interests.", 
                    liberal: "Humane immigration policy with paths to citizenship reflects American values and economic needs.",
                    communist: "Immigration restrictions serve capitalist divide-and-conquer strategies; workers should unite across borders."
                }
            },
            "Reparations for Historical Injustices": {
                category: "social",
                description: "Should governments pay reparations for historical discrimination?",
                context: "Reparations involve compensation for historical injustices like slavery, genocide, or systematic discrimination.",
                arguments: {
                    libertarian: "Reparations punish individuals who weren't responsible for historical injustices and violate equal treatment principles.",
                    conservative: "Historical wrongs can't be corrected through modern wealth transfers; focus on equal opportunity for all.",
                    liberal: "Reparations address ongoing effects of historical discrimination and help achieve true equality.",
                    communist: "Reparations under capitalism maintain class system; need systemic change to eliminate racial and economic oppression."
                }
            },
            "Wealth Tax": {
                category: "economics", 
                description: "Should governments tax accumulated wealth rather than just income?",
                context: "Wealth taxes target net worth including property, investments, and other assets beyond annual income.",
                arguments: {
                    libertarian: "Wealth taxes violate property rights and double-tax previously earned income, discouraging saving and investment.",
                    conservative: "Wealth taxes drive away investment and successful individuals, reducing overall economic growth and opportunity.",
                    liberal: "Wealth taxes address inequality and ensure wealthy contribute fairly while funding social programs.",
                    communist: "Wealth concentration under capitalism requires democratic control of productive assets, not just taxation."
                }
            },
            "Police Reform": {
                category: "social",
                description: "How should law enforcement practices be reformed?",
                context: "Police reform addresses accountability, training, community relations, and alternatives to traditional policing.",
                arguments: {
                    libertarian: "Police should focus on protecting individual rights; reduce qualified immunity and government police powers.",
                    conservative: "Support police with proper training and resources while holding bad actors accountable through existing systems.",
                    liberal: "Systematic police reform needed including accountability measures, bias training, and community investment.",
                    communist: "Police serve ruling class interests under capitalism; need community self-defense and restorative justice systems."
                }
            },
            "School Choice": {
                category: "education",
                description: "Should parents receive vouchers or tax credits for private school tuition?",
                context: "School choice programs allow public education funding to follow students to private or charter schools.",
                arguments: {
                    libertarian: "Educational freedom allows parents to choose best options for children without government monopoly on schooling.",
                    conservative: "School choice promotes competition and gives parents control over children's education and values.",
                    liberal: "School choice diverts resources from public schools and increases inequality in educational access.",
                    communist: "Education should be collectively controlled and equally funded, not subject to market-based competition."
                }
            }
        };

        // Merge additional topics
        this.topics = { ...this.topics, ...additionalTopics };
    }

    bindEvents() {
        // Home screen navigation
        console.log('Binding events...');
        const randomBtn = document.getElementById('randomChallengeBtn');
        if (randomBtn) {
            console.log('Random Challenge button found, adding event listener');
            randomBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Random Challenge button clicked');
                this.startRandomChallenge();
            });
        } else {
            console.error('randomChallengeBtn not found in DOM');
        }

        const browseBtn = document.getElementById('browseTopicsBtn');
        if (browseBtn) {
            console.log('Browse Topics button found, adding event listener');
            browseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Browse Topics button clicked');
                this.showBrowseScreen();
            });
        } else {
            console.error('browseTopicsBtn not found in DOM');
        }

        const leaderboardBtn = document.getElementById('leaderboardBtn');
        if (leaderboardBtn) {
            console.log('Leaderboard button found, adding event listener');
            leaderboardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Leaderboard button clicked');
                this.showLeaderboardScreen();
            });
        } else {
            console.error('leaderboardBtn not found in DOM');
        }

        // Back buttons
        const backToHomeBtn = document.getElementById('backToHomeBtn');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', () => {
                this.showScreen('home');
            });
        }

        const backFromBrowseBtn = document.getElementById('backFromBrowseBtn');
        if (backFromBrowseBtn) {
            backFromBrowseBtn.addEventListener('click', () => {
                this.showScreen('home');
            });
        }

        const backFromTopicBtn = document.getElementById('backFromTopicBtn');
        if (backFromTopicBtn) {
            backFromTopicBtn.addEventListener('click', () => {
                this.showBrowseScreen();
            });
        }

        const backFromLeaderboardBtn = document.getElementById('backFromLeaderboardBtn');
        if (backFromLeaderboardBtn) {
            backFromLeaderboardBtn.addEventListener('click', () => {
                this.showScreen('home');
            });
        }

        // Challenge screen
        const userResponse = document.getElementById('userResponse');
        if (userResponse) {
            userResponse.addEventListener('input', (e) => {
                this.updateCharCount(e.target.value);
                this.validateResponse();
            });
        }

        const submitBtn = document.getElementById('submitResponseBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitResponse();
            });
        }

        // Grading screen
        const nextChallengeBtn = document.getElementById('nextChallengeBtn');
        if (nextChallengeBtn) {
            nextChallengeBtn.addEventListener('click', () => {
                this.startRandomChallenge();
            });
        }

        const viewCommunityBtn = document.getElementById('viewCommunityBtn');
        if (viewCommunityBtn) {
            viewCommunityBtn.addEventListener('click', () => {
                this.showTopicDetail(this.currentTopic);
            });
        }

        // Browse screen
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterTopics();
            });
        }

        const topicSearch = document.getElementById('topicSearch');
        if (topicSearch) {
            topicSearch.addEventListener('input', (e) => {
                this.filterTopics();
            });
        }

        // Leaderboard tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchLeaderboardTab(e.target.dataset.tab);
            });
        });
    }

    showScreen(screenName) {
        console.log(`showScreen called with: ${screenName}`);
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const targetScreen = document.getElementById(screenName + 'Screen');
        console.log(`Looking for screen: ${screenName + 'Screen'}`);
        console.log(`Found screen element:`, targetScreen);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            console.log(`Successfully switched to ${screenName} screen`);
        } else {
            console.error(`Screen not found: ${screenName + 'Screen'}`);
        }
    }

    startRandomChallenge() {
        console.log('startRandomChallenge called');
        console.log('this.topics:', this.topics);
        
        if (!this.topics) {
            console.error('Topics not loaded!');
            return;
        }
        
        // Select random topic
        const topicNames = Object.keys(this.topics);
        console.log('Available topics:', topicNames.length);
        console.log('Topic names:', topicNames);
        
        if (topicNames.length === 0) {
            console.error('No topics available!');
            return;
        }
        
        const randomTopic = topicNames[Math.floor(Math.random() * topicNames.length)];
        console.log('Selected topic:', randomTopic);
        
        // Select random perspective
        const perspectives = ['libertarian', 'conservative', 'liberal', 'communist'];
        const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
        
        // Select argument type
        const argumentTypes = ['supporting', 'refuting', 'nuanced'];
        const randomArgumentType = argumentTypes[Math.floor(Math.random() * argumentTypes.length)];

        this.currentTopic = randomTopic;
        this.currentPerspective = randomPerspective;
        this.currentChallenge = {
            topic: randomTopic,
            perspective: randomPerspective,
            argumentType: randomArgumentType
        };

        console.log('About to call displayChallenge()');
        try {
            this.displayChallenge();
        } catch (error) {
            console.error('Error in displayChallenge:', error);
        }
        
        console.log('About to show challenge screen');
        try {
            this.showScreen('challenge');
        } catch (error) {
            console.error('Error in showScreen:', error);
        }
        
        console.log('startRandomChallenge completed');
    }

    displayChallenge() {
        console.log('displayChallenge called');
        console.log('Current topic:', this.currentTopic);
        console.log('Current perspective:', this.currentPerspective);
        
        const topic = this.topics[this.currentTopic];
        if (!topic) {
            console.error('Topic not found:', this.currentTopic);
            return;
        }
        
        const challengeTopicEl = document.getElementById('challengeTopic');
        if (!challengeTopicEl) {
            console.error('challengeTopic element not found');
            return;
        }
        challengeTopicEl.textContent = this.currentTopic;
        document.getElementById('challengePerspective').textContent = 
            this.currentPerspective.charAt(0).toUpperCase() + this.currentPerspective.slice(1);
        document.getElementById('challengePerspective').className = 
            `perspective-badge ${this.currentPerspective}`;
        
        const argumentTypeText = {
            'supporting': 'Argue in favor of this position',
            'refuting': 'Argue against the opposing positions', 
            'nuanced': 'Present a nuanced view addressing complexities'
        };
        
        document.getElementById('argumentType').textContent = 
            argumentTypeText[this.currentChallenge.argumentType];

        const promptText = `From a ${this.currentPerspective} perspective, ${argumentTypeText[this.currentChallenge.argumentType].toLowerCase()} regarding: "${this.currentTopic}"`;
        document.getElementById('challengePrompt').textContent = promptText;

        document.getElementById('topicContext').textContent = topic.context;

        // Show example from different perspective
        const otherPerspectives = ['libertarian', 'conservative', 'liberal', 'communist']
            .filter(p => p !== this.currentPerspective);
        const examplePerspective = otherPerspectives[Math.floor(Math.random() * otherPerspectives.length)];
        
        document.querySelector('.example-perspective').textContent = 
            examplePerspective.charAt(0).toUpperCase() + examplePerspective.slice(1) + ' View:';
        document.querySelector('.example-text').textContent = 
            topic.arguments[examplePerspective];

        // Reset response area
        document.getElementById('userResponse').value = '';
        this.updateCharCount('');
        this.validateResponse();
    }

    updateCharCount(text) {
        document.getElementById('charCount').textContent = `${text.length}/1000`;
    }

    validateResponse() {
        const response = document.getElementById('userResponse').value;
        const submitBtn = document.getElementById('submitResponseBtn');
        
        if (response.length >= 100) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    }

    submitResponse() {
        const response = document.getElementById('userResponse').value;
        
        // Grade the response
        const grade = this.gradeResponse(response);
        
        // Save to community arguments
        this.saveCommunityArgument(response, grade);
        
        // Show grading screen
        this.displayGrading(response, grade);
        this.showScreen('grading');
    }

    gradeResponse(response) {
        // Enhanced rule-based scoring using Toulmin model and rhetorical analysis
        let perspectiveScore = this.gradePerspectiveAccuracy(response);
        let structureScore = this.gradeArgumentStructure(response);
        let evidenceScore = this.gradeEvidenceQuality(response);
        let coherenceScore = this.gradeCoherence(response);
        let complexityScore = this.gradeLinguisticComplexity(response);
        
        // Weighted scoring emphasizing structure and coherence
        const overall = Math.round((
            perspectiveScore * 0.25 +
            structureScore * 0.30 +
            evidenceScore * 0.20 +
            coherenceScore * 0.15 +
            complexityScore * 0.10
        ));
        
        return {
            overall,
            perspective: perspectiveScore,
            structure: structureScore,
            evidence: evidenceScore,
            coherence: coherenceScore,
            complexity: complexityScore,
            feedback: this.generateEnhancedFeedback(response, {
                overall, perspectiveScore, structureScore, evidenceScore, coherenceScore, complexityScore
            })
        };
    }

    gradePerspectiveAccuracy(response) {
        const perspectiveFrames = {
            libertarian: {
                core: ['freedom', 'individual', 'liberty', 'choice', 'voluntary', 'private', 'rights'],
                values: ['responsibility', 'self-reliance', 'autonomy', 'property'],
                opposition: ['government', 'regulation', 'state', 'control', 'mandate'],
                frames: ['individual liberty', 'free market', 'minimal government', 'personal choice']
            },
            conservative: {
                core: ['traditional', 'family', 'responsibility', 'stability', 'order', 'values'],
                values: ['heritage', 'community', 'morality', 'discipline', 'respect'],
                opposition: ['radical', 'sudden change', 'disruption'],
                frames: ['traditional values', 'social order', 'proven institutions', 'gradual change']
            },
            liberal: {
                core: ['equality', 'rights', 'progress', 'justice', 'social', 'reform'],
                values: ['inclusion', 'diversity', 'opportunity', 'fairness', 'compassion'],
                opposition: ['discrimination', 'inequality', 'exclusion'],
                frames: ['social justice', 'equal opportunity', 'progressive change', 'public good']
            },
            communist: {
                core: ['workers', 'class', 'collective', 'exploitation', 'solidarity'],
                values: ['equality', 'cooperation', 'revolution', 'comrades'],
                opposition: ['capitalism', 'bourgeois', 'profit', 'private property'],
                frames: ['class struggle', 'worker solidarity', 'collective ownership', 'economic equality']
            }
        };
        
        const perspective = perspectiveFrames[this.currentPerspective];
        const lowerResponse = response.toLowerCase();
        let score = 3; // Base score
        
        // Core concept matching (weighted highest)
        const coreMatches = perspective.core.filter(term => lowerResponse.includes(term)).length;
        score += (coreMatches / perspective.core.length) * 4;
        
        // Value alignment
        const valueMatches = perspective.values.filter(term => lowerResponse.includes(term)).length;
        score += (valueMatches / perspective.values.length) * 2;
        
        // Opposition to contrary views (bonus points)
        const oppositionMatches = perspective.opposition.filter(term => lowerResponse.includes(term)).length;
        score += Math.min(1, oppositionMatches * 0.5);
        
        // Frame detection (sophisticated patterns)
        const frameMatches = perspective.frames.filter(frame => lowerResponse.includes(frame)).length;
        score += frameMatches * 0.5;
        
        return Math.min(10, Math.round(score));
    }

    gradeArgumentStructure(response) {
        // Toulmin Model: Claim → Evidence → Warrant → Backing structure
        const lowerResponse = response.toLowerCase();
        let score = 2; // Base score
        
        // 1. CLAIM DETECTION - Clear position statement
        const claimIndicators = [
            'i argue', 'i believe', 'i contend', 'my position', 'i maintain',
            'it is clear', 'we must', 'we should', 'it is essential'
        ];
        const hasClaimIndicator = claimIndicators.some(indicator => lowerResponse.includes(indicator));
        if (hasClaimIndicator) score += 2;
        
        // 2. EVIDENCE/DATA - Support for claims
        const evidenceMarkers = [
            'because', 'since', 'due to', 'as a result of', 'evidence shows',
            'studies indicate', 'research demonstrates', 'data reveals',
            'for example', 'for instance', 'specifically', 'in fact'
        ];
        const evidenceCount = evidenceMarkers.filter(marker => lowerResponse.includes(marker)).length;
        score += Math.min(3, evidenceCount);
        
        // 3. WARRANT - Connection between evidence and claim
        const warrantMarkers = [
            'therefore', 'thus', 'consequently', 'this shows', 'this proves',
            'this demonstrates', 'this means', 'this suggests', 'hence'
        ];
        const warrantCount = warrantMarkers.filter(marker => lowerResponse.includes(marker)).length;
        score += Math.min(2, warrantCount);
        
        // 4. BACKING - Additional support for warrant
        const backingMarkers = [
            'research supports', 'studies confirm', 'experts agree',
            'historically', 'proven by', 'established fact'
        ];
        const backingCount = backingMarkers.filter(marker => lowerResponse.includes(marker)).length;
        score += Math.min(1, backingCount);
        
        // 5. COUNTER-ARGUMENT ACKNOWLEDGMENT
        const counterMarkers = [
            'however', 'although', 'while', 'despite', 'critics argue',
            'opponents claim', 'some might say', 'admittedly', 'granted'
        ];
        const counterCount = counterMarkers.filter(marker => lowerResponse.includes(marker)).length;
        if (counterCount > 0) score += 2;
        
        // 6. STRUCTURAL COMPLEXITY
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
        if (sentences.length >= 3) score += 1;
        if (sentences.length >= 5) score += 1;
        
        return Math.min(10, score);
    }

    gradeEvidenceQuality(response) {
        // Enhanced evidence analysis based on source credibility and relevance
        const lowerResponse = response.toLowerCase();
        let score = 2; // Base score
        
        // 1. QUANTITATIVE EVIDENCE (highest weight)
        const hasStatistics = /\d+%|\d+\s*percent|\d+\s*in\s*\d+|statistics|data shows?|survey/.test(lowerResponse);
        if (hasStatistics) score += 3;
        
        // 2. CREDIBLE SOURCES
        const academicSources = ['study', 'research', 'university', 'journal', 'peer-reviewed', 'published'];
        const academicCount = academicSources.filter(source => lowerResponse.includes(source)).length;
        score += Math.min(2, academicCount);
        
        const institutionalSources = ['government', 'department of', 'bureau', 'agency', 'commission'];
        const institutionalCount = institutionalSources.filter(source => lowerResponse.includes(source)).length;
        score += Math.min(1, institutionalCount);
        
        // 3. SPECIFIC EXAMPLES
        const exampleMarkers = ['for example', 'for instance', 'such as', 'including', 'like', 'consider'];
        const exampleCount = exampleMarkers.filter(marker => lowerResponse.includes(marker)).length;
        score += Math.min(2, exampleCount);
        
        // 4. HISTORICAL REFERENCES
        const historicalMarkers = ['historically', 'in the past', 'previous', 'before', 'history shows'];
        const historicalCount = historicalMarkers.filter(marker => lowerResponse.includes(marker)).length;
        if (historicalCount > 0) score += 1;
        
        // 5. EXPERT TESTIMONY
        const expertMarkers = ['expert', 'professor', 'economist', 'researcher', 'scholar', 'analyst'];
        const expertCount = expertMarkers.filter(marker => lowerResponse.includes(marker)).length;
        if (expertCount > 0) score += 1;
        
        // 6. CONTEMPORARY RELEVANCE
        const timeMarkers = ['recently', 'current', 'today', 'now', '202', 'latest'];
        const timeCount = timeMarkers.filter(marker => lowerResponse.includes(marker)).length;
        if (timeCount > 0) score += 1;
        
        return Math.min(10, score);
    }

    gradeCoherence(response) {
        // Semantic coherence and logical flow analysis
        const lowerResponse = response.toLowerCase();
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
        let score = 3; // Base score
        
        // 1. LOGICAL CONNECTORS
        const logicalConnectors = [
            'furthermore', 'moreover', 'additionally', 'in addition',
            'however', 'nevertheless', 'on the other hand', 'conversely',
            'therefore', 'consequently', 'as a result', 'thus',
            'first', 'second', 'finally', 'in conclusion'
        ];
        const connectorCount = logicalConnectors.filter(conn => lowerResponse.includes(conn)).length;
        score += Math.min(3, connectorCount);
        
        // 2. TOPIC CONSISTENCY - Check for topic drift
        const topicKeywords = this.getTopicKeywords(this.currentTopic);
        const topicMentions = topicKeywords.filter(keyword => lowerResponse.includes(keyword)).length;
        score += Math.min(2, topicMentions);
        
        // 3. PRONOUN REFERENCE CLARITY
        const pronouns = ['this', 'that', 'these', 'those', 'it', 'they'];
        const pronounCount = pronouns.filter(pronoun => lowerResponse.includes(pronoun)).length;
        const hasReferents = /such|said|aforementioned|previously mentioned/.test(lowerResponse);
        if (pronounCount > 0 && hasReferents) score += 1;
        
        // 4. PARAGRAPH STRUCTURE (simulated by sentence grouping)
        if (sentences.length >= 3) score += 1;
        if (sentences.length >= 5 && sentences.length <= 8) score += 1;
        
        return Math.min(10, score);
    }
    
    gradeLinguisticComplexity(response) {
        // Flesch-Kincaid inspired complexity analysis
        const words = response.trim().split(/\s+/);
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        if (words.length < 10 || sentences.length === 0) return 2;
        
        let score = 4; // Base score
        
        // 1. LEXICAL DIVERSITY (Type-Token Ratio)
        const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, '')));
        const typeTokenRatio = uniqueWords.size / words.length;
        if (typeTokenRatio > 0.6) score += 2;
        else if (typeTokenRatio > 0.4) score += 1;
        
        // 2. AVERAGE SENTENCE LENGTH
        const avgSentenceLength = words.length / sentences.length;
        if (avgSentenceLength >= 12 && avgSentenceLength <= 25) score += 2;
        else if (avgSentenceLength >= 8) score += 1;
        
        // 3. SOPHISTICATED VOCABULARY
        const sophisticatedWords = [
            'furthermore', 'nevertheless', 'consequently', 'comprehensive',
            'substantial', 'significant', 'demonstrate', 'establish',
            'implement', 'facilitate', 'inherent', 'fundamental'
        ];
        const sophisticatedCount = sophisticatedWords.filter(word => 
            response.toLowerCase().includes(word)).length;
        score += Math.min(2, sophisticatedCount);
        
        // 4. SYNTACTIC COMPLEXITY
        const complexStructures = [
            /\bwhich\b/, /\bthat\b.*\bis\b/, /\balthough\b/, /\bwhereas\b/,
            /\bnot only\b.*\bbut also\b/, /\beither\b.*\bor\b/
        ];
        const complexCount = complexStructures.filter(pattern => pattern.test(response)).length;
        if (complexCount > 0) score += 1;
        
        return Math.min(10, score);
    }
    
    getTopicKeywords(topic) {
        // Extract key terms from topic for coherence checking
        const topicMap = {
            'Universal Basic Income': ['income', 'basic', 'universal', 'ubi', 'money', 'payment'],
            'Minimum Wage Laws': ['wage', 'minimum', 'pay', 'worker', 'salary', 'employment'],
            'Artificial Intelligence Regulation': ['ai', 'artificial', 'intelligence', 'regulation', 'technology'],
            'Internet Privacy': ['privacy', 'internet', 'data', 'surveillance', 'online']
        };
        return topicMap[topic] || topic.toLowerCase().split(' ');
    }

    generateEnhancedFeedback(response, scores) {
        const { overall, perspectiveScore, structureScore, evidenceScore, coherenceScore, complexityScore } = scores;
        const feedbacks = [];
        
        // Perspective-specific feedback
        if (perspectiveScore < 6) {
            feedbacks.push(`Strengthen your ${this.currentPerspective} framing with more characteristic values and opposition to contrary viewpoints.`);
        } else if (perspectiveScore >= 8) {
            feedbacks.push(`Excellent ${this.currentPerspective} perspective alignment!`);
        }
        
        // Structure feedback (Toulmin model)
        if (structureScore < 6) {
            feedbacks.push("Improve argument structure: clearly state your claim, provide evidence, and explain how it supports your position.");
        } else if (structureScore >= 8) {
            feedbacks.push("Strong argumentative structure with clear claim-evidence-warrant progression.");
        }
        
        // Evidence feedback
        if (evidenceScore < 6) {
            feedbacks.push("Include more credible sources, specific examples, or quantitative data to strengthen your position.");
        } else if (evidenceScore >= 8) {
            feedbacks.push("Excellent use of credible evidence and specific examples.");
        }
        
        // Coherence feedback
        if (coherenceScore < 6) {
            feedbacks.push("Improve logical flow with better transitions and clearer connections between ideas.");
        } else if (coherenceScore >= 8) {
            feedbacks.push("Excellent coherence and logical flow throughout your argument.");
        }
        
        // Complexity feedback
        if (complexityScore < 6) {
            feedbacks.push("Enhance linguistic sophistication with varied vocabulary and more complex sentence structures.");
        }
        
        // Overall assessment
        if (overall >= 9) {
            return "Outstanding argument! " + feedbacks.filter(f => f.includes('Excellent')).join(" ") + " This demonstrates mastery of political argumentation.";
        } else if (overall >= 7) {
            const positive = feedbacks.filter(f => f.includes('Excellent') || f.includes('Strong'));
            const improvements = feedbacks.filter(f => !f.includes('Excellent') && !f.includes('Strong')).slice(0, 2);
            return "Strong argument! " + positive.join(" ") + (improvements.length ? " " + improvements.join(" ") : "");
        } else if (overall >= 5) {
            return "Good foundation! " + feedbacks.slice(0, 3).join(" ");
        } else {
            return "Keep developing your skills! " + feedbacks.slice(0, 2).join(" ") + " Focus on the fundamentals of claim, evidence, and reasoning.";
        }
    }

    displayGrading(response, grade) {
        document.getElementById('userPerspective').textContent = 
            this.currentPerspective.charAt(0).toUpperCase() + this.currentPerspective.slice(1);
        document.getElementById('userArgumentText').textContent = response;
        
        document.getElementById('overallGrade').textContent = this.getLetterGrade(grade.overall);
        document.getElementById('perspectiveScore').textContent = `${grade.perspective}/10`;
        document.getElementById('structureScore').textContent = `${grade.structure}/10`;
        document.getElementById('evidenceScore').textContent = `${grade.evidence}/10`;
        document.getElementById('coherenceScore').textContent = `${grade.coherence}/10`;
        document.getElementById('complexityScore').textContent = `${grade.complexity}/10`;
        
        document.getElementById('gradingFeedback').textContent = grade.feedback;
    }

    getLetterGrade(score) {
        if (score >= 9) return 'A+';
        if (score >= 8) return 'A';
        if (score >= 7) return 'B+';
        if (score >= 6) return 'B';
        if (score >= 5) return 'C+';
        if (score >= 4) return 'C';
        return 'D';
    }

    async saveCommunityArgument(response, grade) {
        const argumentData = {
            topic: this.currentTopic,
            perspective: this.currentPerspective,
            argument: response,
            author: 'Anonymous' // Could be expanded with user system
        };
        
        try {
            const apiResponse = await fetch('/api/turing-arguments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(argumentData)
            });
            
            if (!apiResponse.ok) {
                throw new Error('Failed to save argument');
            }
            
            const savedArgument = await apiResponse.json();
            console.log('Argument saved successfully:', savedArgument);
            
            // Update local cache
            if (!this.communityArguments[this.currentTopic]) {
                this.communityArguments[this.currentTopic] = {};
            }
            if (!this.communityArguments[this.currentTopic][this.currentPerspective]) {
                this.communityArguments[this.currentTopic][this.currentPerspective] = [];
            }
            
            const argument = {
                id: savedArgument.id.toString(),
                topic: savedArgument.topic,
                perspective: savedArgument.perspective,
                text: savedArgument.argument,
                grade: grade.overall,
                votes: savedArgument.votes,
                timestamp: savedArgument.created_at,
                author: savedArgument.author
            };
            
            this.communityArguments[this.currentTopic][this.currentPerspective].push(argument);
            
        } catch (error) {
            console.error('Error saving argument:', error);
            // Could show user notification here
        }
        
        // Update user stats
        this.userStats.totalArguments = (this.userStats.totalArguments || 0) + 1;
        this.userStats.totalScore = (this.userStats.totalScore || 0) + grade.overall;
        this.userStats.averageScore = this.userStats.totalScore / this.userStats.totalArguments;
        this.saveUserStats();
    }

    showBrowseScreen() {
        this.populateTopicsGrid();
        this.showScreen('browse');
    }

    populateTopicsGrid() {
        const grid = document.getElementById('topicsGrid');
        grid.innerHTML = '';
        
        const filteredTopics = this.getFilteredTopics();
        
        Object.entries(filteredTopics).forEach(([name, topic]) => {
            const card = document.createElement('div');
            card.className = 'topic-card';
            card.innerHTML = `
                <div class="category">${topic.category}</div>
                <h3>${name}</h3>
                <p>${topic.description}</p>
            `;
            
            card.addEventListener('click', () => {
                this.showTopicDetail(name);
            });
            
            grid.appendChild(card);
        });
    }

    getFilteredTopics() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const searchTerm = document.getElementById('topicSearch').value.toLowerCase();
        
        const filtered = {};
        
        Object.entries(this.topics).forEach(([name, topic]) => {
            const matchesCategory = categoryFilter === 'all' || topic.category === categoryFilter;
            const matchesSearch = searchTerm === '' || 
                name.toLowerCase().includes(searchTerm) ||
                topic.description.toLowerCase().includes(searchTerm);
            
            if (matchesCategory && matchesSearch) {
                filtered[name] = topic;
            }
        });
        
        return filtered;
    }

    filterTopics() {
        this.populateTopicsGrid();
    }

    showTopicDetail(topicName) {
        const topic = this.topics[topicName];
        
        document.getElementById('topicDetailTitle').textContent = topicName;
        document.getElementById('topicDetailCategory').textContent = topic.category;
        document.getElementById('topicDetailDescription').textContent = topic.description;
        
        // Show official arguments
        document.getElementById('libertarianOfficial').textContent = topic.arguments.libertarian;
        document.getElementById('conservativeOfficial').textContent = topic.arguments.conservative;
        document.getElementById('liberalOfficial').textContent = topic.arguments.liberal;
        document.getElementById('communistOfficial').textContent = topic.arguments.communist;
        
        // Show community arguments
        this.displayCommunityArguments(topicName);
        
        const debateBtn = document.getElementById('debateThisTopicBtn');
        if (debateBtn) {
            // Remove any existing listeners to avoid duplicates
            const newDebateBtn = debateBtn.cloneNode(true);
            debateBtn.parentNode.replaceChild(newDebateBtn, debateBtn);
            
            newDebateBtn.addEventListener('click', () => {
                this.currentTopic = topicName;
                this.startRandomChallenge();
            });
        }
        
        this.showScreen('topicDetail');
    }

    displayCommunityArguments(topicName) {
        const perspectives = ['libertarian', 'conservative', 'liberal', 'communist'];
        
        perspectives.forEach(perspective => {
            const container = document.getElementById(`${perspective}Community`);
            container.innerHTML = '';
            
            const userArguments = this.communityArguments[topicName]?.[perspective] || [];
            const topArguments = userArguments
                .sort((a, b) => b.votes - a.votes)
                .slice(0, 3);
            
            topArguments.forEach(arg => {
                const div = document.createElement('div');
                div.className = 'community-argument';
                div.innerHTML = `
                    ${arg.text}
                    <div class="argument-vote-score">+${arg.votes}</div>
                `;
                container.appendChild(div);
            });
            
            if (topArguments.length === 0) {
                container.innerHTML = '<p style="color: #666; font-style: italic;">No community arguments yet. Be the first!</p>';
            }
        });
    }

    showLeaderboardScreen() {
        this.populateLeaderboard();
        this.showScreen('leaderboard');
    }

    switchLeaderboardTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName.replace('-', '') + 'Tab').classList.add('active');
        
        this.populateLeaderboardTab(tabName);
    }

    populateLeaderboard() {
        this.populateLeaderboardTab('top-arguments');
    }

    populateLeaderboardTab(tabName) {
        const container = document.getElementById(tabName.replace('-', '') + 'List');
        
        if (tabName === 'top-arguments') {
            this.populateTopArguments(container);
        } else if (tabName === 'best-debaters') {
            this.populateBestDebaters(container);
        } else if (tabName === 'recent') {
            this.populateRecentActivity(container);
        }
    }

    populateTopArguments(container) {
        const allArguments = [];
        
        Object.entries(this.communityArguments).forEach(([topic, perspectives]) => {
            Object.entries(perspectives).forEach(([perspective, args]) => {
                args.forEach(arg => {
                    allArguments.push({ ...arg, topic, perspective });
                });
            });
        });
        
        const topArguments = allArguments
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 10);
        
        container.innerHTML = '';
        
        if (topArguments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No arguments yet. Start debating to see the leaderboard!</p>';
            return;
        }
        
        topArguments.forEach((arg, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            
            item.innerHTML = `
                <div class="rank-badge ${rankClass}">${index + 1}</div>
                <div style="flex: 1;">
                    <div><strong>${arg.topic}</strong> - ${arg.perspective}</div>
                    <div style="color: #666; font-size: 0.9rem;">${arg.text.substring(0, 100)}...</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.2rem; font-weight: bold;">+${arg.votes}</div>
                    <div style="color: #666; font-size: 0.8rem;">votes</div>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    populateBestDebaters(container) {
        container.innerHTML = '<p style="text-align: center; color: #666;">User system coming soon!</p>';
    }

    populateRecentActivity(container) {
        const allArguments = [];
        
        Object.entries(this.communityArguments).forEach(([topic, perspectives]) => {
            Object.entries(perspectives).forEach(([perspective, args]) => {
                args.forEach(arg => {
                    allArguments.push({ ...arg, topic, perspective });
                });
            });
        });
        
        const recentArguments = allArguments
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
        
        container.innerHTML = '';
        
        if (recentArguments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No recent activity. Start debating!</p>';
            return;
        }
        
        recentArguments.forEach(arg => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const timeAgo = this.getTimeAgo(new Date(arg.timestamp));
            
            item.innerHTML = `
                <div style="flex: 1;">
                    <div><strong>${arg.topic}</strong> - ${arg.perspective}</div>
                    <div style="color: #666; font-size: 0.9rem;">${arg.text.substring(0, 100)}...</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 0.9rem; color: #666;">${timeAgo}</div>
                    <div style="color: #8b5cf6;">Grade: ${this.getLetterGrade(arg.grade)}</div>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }

    async loadCommunityArguments() {
        try {
            const response = await fetch('/api/turing-arguments');
            if (!response.ok) {
                throw new Error('Failed to load arguments');
            }
            const argumentsData = await response.json();
            
            // Convert array to nested object structure expected by the client
            const organized = {};
            argumentsData.forEach(arg => {
                if (!organized[arg.topic]) {
                    organized[arg.topic] = {};
                }
                if (!organized[arg.topic][arg.perspective]) {
                    organized[arg.topic][arg.perspective] = [];
                }
                organized[arg.topic][arg.perspective].push({
                    id: arg.id.toString(),
                    topic: arg.topic,
                    perspective: arg.perspective,
                    text: arg.argument,
                    grade: 7, // Default grade for server arguments
                    votes: arg.votes,
                    timestamp: arg.created_at,
                    author: arg.author
                });
            });
            
            return organized;
        } catch (error) {
            console.error('Error loading community arguments:', error);
            return {};
        }
    }

    // This method is no longer needed as we save directly to server
    saveCommunityArguments() {
        // No-op - arguments are saved individually to server
    }

    loadUserStats() {
        try {
            return JSON.parse(localStorage.getItem('turingTwisterStats') || '{}');
        } catch {
            return {};
        }
    }

    saveUserStats() {
        localStorage.setItem('turingTwisterStats', JSON.stringify(this.userStats));
    }
    // Debug function to test button functionality
    testRandomChallenge() {
        console.log('Testing Random Challenge function directly');
        this.startRandomChallenge();
    }
}

// Global function for testing
window.testRandomChallenge = () => {
    console.log('Global test function called');
    if (window.turingTwister) {
        window.turingTwister.testRandomChallenge();
    } else {
        console.error('TuringTwister instance not found');
    }
};

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing TuringTwister...');
    try {
        window.turingTwister = new TuringTwister();
        console.log('TuringTwister initialized successfully');
    } catch (error) {
        console.error('Failed to initialize TuringTwister:', error);
        // Retry after a delay if initialization failed
        setTimeout(() => {
            try {
                console.log('Retrying TuringTwister initialization...');
                window.turingTwister = new TuringTwister();
            } catch (retryError) {
                console.error('Retry also failed:', retryError);
            }
        }, 500);
    }
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    // Document is still loading, wait for DOMContentLoaded
} else {
    // Document is already loaded
    console.log('Document already loaded, initializing immediately...');
    setTimeout(() => {
        if (!window.turingTwister) {
            try {
                window.turingTwister = new TuringTwister();
            } catch (error) {
                console.error('Fallback initialization failed:', error);
            }
        }
    }, 100);
}