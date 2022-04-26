# Welcome!
This script enables automatic creation of a new Git branch each time a specific tracking plan is updated in Segment.  Segment makes NO WARRANTY about the reliability of this script!  It's strictly a prototype.

https://app.segment.com/protocols-diffs/protocols/tracking-plans/rs_21hKQhOWPUZMLZ2Y7efsECRrV0D
Protocols-diffs: Workspace Slug
rs_21hKQhOWPUZMLZ2Y7efsECRrV0D: Tracking Plan ID

https://github.com/segment-services-eng/Segment-Tracking-Plan
segment-services-eng: gitUser
Segment-Tracking-Plan: gitRepoSlug

# Destination Function Set Up
1. Following this link: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token , set up a github personal token

2. Create an HTTP API Source named: Segment Activity Feed
3. Go to Settings -> Workspace Settings -> Audit Forwarding and enable the Forward to the following Source: toggle
4. Select Segment Activity Feed.

5. Copy this code into a destination function on Segment:
async function onTrack(event, settings) {
	// Learn more at https://segment.com/docs/connections/spec/track/
	const devEndpoint = `https://api.github.com/repos/${settings.gitUser}/${settings.gitRepoSlug}/dispatches`;
	const prodEndpoint = `https://api.github.com/repos/${settings.gitUser}/${settings.gitProdRepoSlug}/dispatches`;
	var userSubject = event.properties.details.subject;
	var userBool = userSubject.includes('user/');
	var tokenBool = userSubject.includes('token/');
	var trackingPlan = event.properties.details.target;

	var timestamp = event.timestamp;
	var indexOfPeriod = timestamp.indexOf('.');
	timestamp = timestamp.substring(0, indexOfPeriod - 3);
	timestamp = timestamp.replace(/:/g, '-');
	timestamp = timestamp.replace('.', '-');
	console.log(timestamp);

	if (
		(event.properties.type == 'Tracking Plan Modified') &
		userBool &
		(trackingPlan == 'Sandbox Tracking Plan')
	) {
		try {
			response = await fetch(devEndpoint, {
				method: 'POST',
				headers: {
					Authorization: `token ${settings.gitToken}`,
					'Content-Type': 'text/plain'
				},
				//  		body: JSON.stringify(event)
				body: JSON.stringify({
					event_type: 'tracking_plan_updated',
					client_payload: {
						timestamp: timestamp
					}
				})
			});
		} catch (error) {
			// Retry on connection error
			throw new RetryError(error.message);
		}

		if (response.status >= 500 || response.status === 429) {
			// Retry on 5xx (server errors) and 429s (rate limits)
			throw new RetryError(`Failed with ${response.status}`);
		}
	}
}

6. Create 3 Settings:
   gitToken, gitUser, gitRepoSlug.
   Input the appropriate values

7. Save and Configure the function.
8. Navigate Back to the Catalog and select your function and click on Connect Destination
9. Create your Destination and Connect it to your Segment Activity Feed Source

# Repo Setup

1. Duplicate this repo so it's entirely separate from the original. 

2. Create a Segment Token in your Segment Workspace with Protocols Admin Privileges
3. Add this token to your Github repository secrets named SEGMENT_CONFIG_API_TOKEN


4. In the index.js file update line 11 to include your github repo path.  Update line 19 and 21 to replace your segment dev and qa tracking plan ids respectively (ie. rs_…).
5. In Segment-Tracking-Plan/.github/workflows/main.yml update line 12 to replace rishnair/Segment-Tracking-Plan with your repository
6. In Segment-Tracking-Plan/.github/workflows/main2.yml update line 11 to replace rishnair/Segment-Tracking-Plan with your repository
7. In Segment-Tracking-Plan/typewriter.yml update line 17 to replace the tracking plan ID with your sandbox tracking plan ID. Update Line 18 with your Segment Workspace Slug. 
In your engineering repo run this command:
		npm install https://github.com/<user>/<repoName>#<versionNumber>
		OR
		Include this in your package.json file:
		  									"dependencies": {
 	   	"Segment-Tracking-Plan": "git+https://github.com/<user>/<repoName>.git#<versionNumber>"
  		  }

