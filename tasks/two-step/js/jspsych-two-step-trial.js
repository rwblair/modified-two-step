/**
* jspsych-two-step
* Sam Zorowitz, Branson Byers, Gili Karni
*
* Plug-in to run two-step task trial

** this task is modified to ask participants for transition probabilities. Lynde Folsom, Ross Blair 2022
**/

jsPsych.plugins["two-step-trial"] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'two-step-trial',
    description: '',
    parameters: {
      transition: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Transition',
        description: 'State transition (common = 1, uncommon = 0).'
      },
      outcomes: {
        type: jsPsych.plugins.parameterType.INT,
        array: true,
        pretty_name: 'Outcomes',
        description: 'Reward outcome for each bandit (reward = 1, no reward = 0).'
      },
      rocket_colors: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        array: true,
        pretty_name: 'Rocket colors',
        description: 'Colors of the state 1 left/right rockets.'
      },
      planet_colors: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        array: true,
        pretty_name: 'Planet colors',
        description: 'Colors of the state 2 planets.'
      },
      planet_names: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        array: true,
        pretty_name: 'Planet color names',
        description: 'Names of colors of the state 2 planets.'
      },
      aliens: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        array: true,
        pretty_name: 'Aliens',
        description: 'Paths to alien images (length 4 array).'
      },
      randomize_s1: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Randomize (state 1)',
        default: true,
        description: 'Randomize left/right positions of state 1 rockets.'
      },
      randomize_s2: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Randomize (state 2)',
        default: true,
        description: 'Randomize left/right positions of state 2 aliens.'
      },
      valid_responses_s1: {
        ty1pe: jsPsych.plugins.parameterType.KEYCODE,
        array: true,
        pretty_name: 'Valid responses',
        default: ['arrowleft', 'arrowright'],
        description: 'The keys the subject is allowed to press to respond during the first state.'
      },
      valid_responses_s2: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        array: true,
        pretty_name: 'Valid responses',
        default: ['arrowleft', 'arrowright'],
        description: 'The keys the subject is allowed to press to respond during the second state.'
      },
      choice_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Choice duration',
        default: null,
        description: 'How long to listen for responses before trial ends.'
      },
      feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: 1000,
        description: 'How long to show feedback before it ends.'
      },
      animation: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Animation',
        default: true,
        description: 'Display animations during trial (true / false).'
      }
      
    }
  }

  plugin.trial = function(display_element, trial) {

    //---------------------------------------//
    // Section 1: Define HTML.
    //---------------------------------------//

    // Initialize HTML.
    var new_html = '';

    // Insert CSS (window animation).
    new_html += `<style>
    body {
      height: 100vh;
      max-height: 100vh;
      overflow: hidden;
      position: fixed;
    }
    .jspsych-content-wrapper {
      background: #606060;
      z-index: -1;
    }
    body {
      height: 100vh;
      max-height: 100vh;
      overflow: hidden;
      position: fixed;
    }
    .jspsych-content-wrapper {
      background: #606060;
      z-index: -1;
    }
    .comprehension-box {
      position: absolute;
      top: 50%;
      left: 50%;
      -webkit-transform: translate3d(-50%, -50%, 0);
      transform: translate3d(-50%, -50%, 0);
      width: 600px;
      height: 400px;
      background: #ffffff;
      border: 2px solid black;
      border-radius: 12px;
      font-size: 16px;
      line-height: 1.5em;
    }

    .comprehension-box.alien-comp-box {
      height: 275px;
    }
    .comprehension-box .jspsych-survey-multi-choice-preamble h4 {
      font-size: 18px;
      margin-block-start: 1em;
      margin-block-end: 1.2em;
    }
    .comprehension-box .jspsych-survey-multi-choice-question {
      margin-top: 0em;
      margin-bottom: 1.0em;
      text-align: left;
      padding-left: 2em;
    }
    .comprehension-box .jspsych-survey-multi-choice-horizontal .jspsych-survey-multi-choice-text {
      text-align: left;
      margin: 0em 0em 0em 0em
    }
    .comprehension-box .jspsych-survey-multi-choice-horizontal .jspsych-survey-multi-choice-option {
      display: inline-block;
      margin: 0.33em 1em 0em 1em;
    }
    .comprehension-box .jspsych-survey-multi-choice-option input[type='radio'] {
      margin-right: 0.5em;
      width: 16px;
      height: 16px;
    }
    .comprehension-box input[type='submit'] {
      position: absolute;
      top: 95%;
      left: 50%;
      -webkit-transform: translate(-50%, -50%);
      transform: translate(-50%, -50%);
      font-size: 16px;
      padding: 4px 8px;
    }

    .comprehension-box input[type='range'] {
      display: block;
      margin-left: auto;
      margin-right: auto;
      width: 60%;
    }

    .comprehension-box.alien-comp-box input[type='submit'] {
      top: 85%;
    }
    .rating-box plugin-html-slider-response.js {
      margin-top: 0em;
      margin-bottom: 1.0em;
      text-align: left;
      padding-left: 2em;
    }
    </style>`;

    // Open two-step container.
    new_html += '<div class="two-step-container">';

    // Draw sky & stars.
    new_html += '<div class="landscape-sky" state="1">';
    new_html += '<div class="stars"></div>';
    new_html += '</div>';

    // Draw ground.
    new_html += '<div class="landscape-ground" state="1"></div>';

    // Define mapping of rockets to sides.
    var state_1_ids = [0,1];
    if ( trial.randomize_s1 ) { state_1_ids = jsPsych.randomization.shuffle(state_1_ids); }

    // Draw rockets
    state_1_ids.forEach((j, i) => {
      new_html += `<div class="tower" id="tower-${i}" side="${i}"><div class="arm"></div></div>`;
      new_html += `<div class="platform" id="platform-${i}" side="${i}"></div>`;
      new_html += `<div class="rocket" id="rocket-${i}" state="1" side="${i}">`;
      new_html += '<div class="rocket-body">';
      new_html += `<div class="rocket-window" style="background: ${trial.rocket_colors[j]}"></div>`;
      new_html += '<div class="rocket-studs"></div>';
      new_html += `<div class="rocket-fin" side="0" style="background: ${trial.rocket_colors[j]}"></div>`;
      new_html += `<div class="rocket-fin" side="1" style="background: ${trial.rocket_colors[j]}"></div>`;
      new_html += `<div class="rocket-fire" id="fire-${i}"></div>`;
      new_html += '</div></div>';
    });

    // Define mapping of aliens to sides.
    var state_2_ids = [0,1];
    if ( trial.randomize_s2 ) { state_2_ids = jsPsych.randomization.shuffle(state_2_ids); }

    console.log(state_2_ids)
    // Draw aliens
    state_2_ids.forEach((j, i) => {
      new_html += `<div class="alien" id="alien-${i}" state="1" side="${i}">`;
      new_html += `<img id="alien-${i}-img"></img>`;
      new_html += '</div>';
      new_html += `<div class="diamond" id="diamond-${i}" state="1" side="${i}"></div>`;
      new_html += `<div class="rock" id="rock-${i}" state="1" side="${i}"></div>`;
    });

    // Close wrapper.
    new_html += '</div>';

    // Draw HTML.
    display_element.innerHTML = new_html;

    //---------------------------------------//
    // Section 2: Response handling.
    //---------------------------------------//

    // confirm screen resolution
    const screen_resolution = [window.innerWidth, window.innerHeight];
    if (screen_resolution[0] < 540 || screen_resolution[1] < 400) {
      var minimum_resolution = 0;
    } else {
      var minimum_resolution = 1;
    }

    // Preallocate space
    var response = {
      state_1_key: null,
      state_1_choice: null,
      state_1_rt: null,
      state_1_reported_transition_rating: null,
      state_1_certainty: null,
      state_2: null,
      state_2_key: null,
      state_2_choice: null,
      state_2_rt: null,
      state_2_certainty: null,
      state_2_reported_transition_rating: null,
      outcome: null,
    }

    // function to handle missed responses
    var missed_response = function() {

      // Kill all setTimeout handlers.
      jsPsych.pluginAPI.clearAllTimeouts();
      jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // Display warning message.
      const msg = '<p style="position: absolute; left: 50%; top: 50%; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 20px; line-height: 1.5em; color: black">You did not respond within the allotted time. Please pay more attention on the next trial.<br><br><b>Warning:</b> If you miss too many trials, we may end the exepriment early and reject your work.';

      display_element.innerHTML = '<style>.jspsych-content-wrapper {background: #606060;}</style><div class="two-step-container" style="background: #FFFFFF;">' + msg + '</div>';

      jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
      }, 5000);

    }

    // handle responses during state 1
    var after_first_response = function(info) {

      // Kill all setTimeout handlers.
      jsPsych.pluginAPI.clearAllTimeouts();
      jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // Record responses.
      response.state_1_rt = info.rt;
      response.state_1_key = trial.valid_responses_s1.indexOf(info.key);
      response.state_1_choice = state_1_ids[response.state_1_key];

      // Handle animations
      // If animation = true, then the rocket blast off animation will play.
      // Otherwise, the next state of the trial will present immediately.
      if ( trial.animation ) {

        console.log(display_element.querySelector('#rocket-' + Math.abs(response.state_1_key - 1)).style['display'])
        display_element.querySelector('#rocket-' + Math.abs(response.state_1_key - 1)).style['display'] = 'none';
        display_element.querySelector('#fire-' + response.state_1_key).style['display'] = 'inherit';
        // start of edit--Im adding from below the removal of other rocket
        display_element.querySelector('.landscape-sky').setAttribute('state', '1');
        display_element.querySelector('.landscape-ground').setAttribute('state', '1');
        display_element.querySelector('.landscape-ground').style['background'] = trial.planet_colors[response.state_2];
        //end of edit
        //start of edit-- removing tower
        // Hide rocket elements.
        display_element.querySelector('#platform-0').setAttribute('state', '2');
        display_element.querySelector('#platform-1').setAttribute('state', '2');
        display_element.querySelector('#tower-0').setAttribute('state', '2');
        display_element.querySelector('#tower-1').setAttribute('state', '2');
        //end of edit 

        setTimeout(function() { collect_ratings(); }, 800);
        

      } else {

        collect_ratings();

      }

    };

    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
    }

    var collect_ratings = function() {
      var plugin_id_name = "lmfplugin-html-slider-response.js";
      var plugin_id_selector = '#' + plugin_id_name;
      var _join = function() {
        var arr = Array.prototype.slice.call(arguments, _join.length);
        return arr.join(separator = '-');
      }

      var cValue = 50;
      var lValue = 50;

      var html = '';// form element

      var trial_form_id = _join(plugin_id_name, "form");
      display_element.innerHTML += '<form id="'+trial_form_id+'"></form>';
  
      // Show preamble text
      html += '<div id="'+trial_form_id+'_div" class="comprehension-box">'
      html += '<div class="jspsych-survey-multi-choice-preamble"><h4>To continue, you must answer the following:</h4></div>';

      const color_idx = getRandomInt(0, trial.planet_names.length);
      const planet_color_name = trial.planet_names[color_idx];
      //const planet_font_color = task_info.font_colors[planet_color_name];
      
      //question 1 stage 1
      html += `<div class="jspsych-survey-multi-choice-preamble"> How likely is it you will transition to the <span style="color:${planet_color_name};">${planet_color_name}</span> planet?</div>`;
      html += `<input type="range" id="likelihood" name="likelihood" form="${trial_form_id}">`;
      html += `<label for="likelihood"> <span id="lValue">${lValue}</span>% likely</label>`
      // question 2
      html += '<div class="jspsych-survey-multi-choice-preamble">How certain are you of this choice?</div>';
      html += `<input type="range" id="certainty" name="certainty" form="${trial_form_id}">`;
      html += `<label for="certainty"><span id="cValue">${cValue}</span>% certain</label>`
      html += `<input type="submit" id="${plugin_id_name}-next" class="${plugin_id_name} jspsych-btn" form="${trial_form_id}" disabled=true></input>`;
      html += '</div>';
      html += '</div>';

      display_element.querySelector('.landscape-sky').innerHTML += html;

      var slidersTouched = new Set()
      document.getElementById("certainty").addEventListener("input", (event) => {
        slidersTouched.add("certainty"); 
        document.getElementById(`${plugin_id_name}-next`).disabled = !(slidersTouched.size == 2)
        document.getElementById("cValue").innerText = event.target.value;
      })
      document.getElementById("likelihood").addEventListener("input", (event) => {
        slidersTouched.add("likelihood"); 
        document.getElementById(`${plugin_id_name}-next`).disabled = !(slidersTouched.size == 2);
        document.getElementById("lValue").innerText = event.target.value;
      })
  
      const startTime = performance.now();
      document.getElementById(trial_form_id).addEventListener('submit', function(event) {
        console.log("submit query...")
        event.preventDefault();
  
        // Measure response time
        var endTime = performance.now();
        var response_time = endTime - startTime;
  
        var responses = [];

        // insert data into trial data
        response.state_1_reported_transition_rating = document.getElementById('likelihood').value;
        response.state_1_certainty = document.getElementById('certainty').value;
        // document.querySelector('.landscape-sky').innerHTML = "";
        setTimeout(function() { state_transition(); }, 800);

        display_element.querySelector('.comprehension-box').remove();
      });
    }


    // Intermediate function to update screen objects from state 1 to state 2.
    var state_transition = function() {


      // Define second state.
      response.state_2 = ( trial.transition == 1 ) ? response.state_1_choice : 1 - response.state_1_choice;

      // Define second state ids.
      state_2_ids = state_2_ids.map(function(k) {return k + 2 * response.state_2});

      // Update background.
      display_element.querySelector('.landscape-sky').setAttribute('state', '2');
      display_element.querySelector('.landscape-ground').setAttribute('state', '2');
      display_element.querySelector('.landscape-ground').style['background'] = trial.planet_colors[response.state_2];

      // Hide rocket elements.
      display_element.querySelector('#platform-0').setAttribute('state', '2');
      display_element.querySelector('#platform-1').setAttribute('state', '2');
      display_element.querySelector('#tower-0').setAttribute('state', '2');
      display_element.querySelector('#tower-1').setAttribute('state', '2');

      //Hide the comp box -lmf
      display_element.querySelector('#lmfplugin-html-slider-response.js');

      // Re-position chosen rocket.
      display_element.querySelector('#rocket-' + response.state_1_key).setAttribute('state', '2');
      display_element.querySelector('#fire-' + response.state_1_key).style['display'] = 'none';
      display_element.querySelector('#rocket-' + (1 - response.state_1_key)).style['display'] = 'none';

      // Display aliens.
      display_element.querySelector('#alien-0-img').setAttribute('src', trial.aliens[state_2_ids[0]]);
      display_element.querySelector('#alien-0').setAttribute('state', '2');
      display_element.querySelector('#alien-1-img').setAttribute('src', trial.aliens[state_2_ids[1]]);
      display_element.querySelector('#alien-1').setAttribute('state', '2');

      // start the response listener
      var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_second_response,
        valid_responses: trial.valid_responses_s2,
        rt_method: 'performance',
        persist: false,
        allow_held_key: false
      });

      // end trial if no response.
      if (trial.choice_duration !== null) {
        jsPsych.pluginAPI.setTimeout(function() {
          missed_response();
        }, trial.choice_duration);
      }

    };

    var collect_alien_ratings = function() {
      var plugin_id_name = "lmfplugin-html-slider-response.js";
      var plugin_id_selector = '#' + plugin_id_name;
      var _join = function() {
        var arr = Array.prototype.slice.call(arguments, _join.length);
        return arr.join(separator = '-');
      }

      var html = ''; // form element

      var trial_form_id = _join(plugin_id_name, "form");
      display_element.innerHTML += '<form id="'+trial_form_id+'"></form>';
      var cValue = 50;
      var lValue = 50;
  
      // Show preamble text
      html += '<div id="'+trial_form_id+'_div" class="comprehension-box alien-comp-box">'
      html += '<div class="jspsych-survey-multi-choice-preamble"><h4>To continue, you must answer the following:</h4></div>';

      //question 1 stage 1
      html += `<div class="jspsych-survey-multi-choice-preamble"> How likely is it you will get gems from this alien?</div>`;
      html += `<input type="range" id = "likelihood" form="${trial_form_id}"><span id="lValue">${lValue}</span>% likely</input>`;
      // question 2
      html += '<div class="jspsych-survey-multi-choice-preamble">How certain are you of this choice?</div>';
      html += `<input type="range" id = "certainty" form="${trial_form_id}"><span id="cValue">${cValue}</span>% certain</input>`;
      html += `<input type="submit" id="${plugin_id_name}-next" class="${plugin_id_name} jspsych-btn" form="${trial_form_id}"></input>`;
      html += '</div>';
      html += '</div>';

      display_element.querySelector('.landscape-sky').innerHTML += html;

      var slidersTouched = new Set()
      document.getElementById("certainty").addEventListener("input", () => {
        slidersTouched.add("certainty"); 
        document.getElementById(`${plugin_id_name}-next`).disabled = !(slidersTouched.size == 2)
        document.getElementById("cValue").innerText = event.target.value;
      })
      document.getElementById("likelihood").addEventListener("input", () => {
        slidersTouched.add("likelihood"); 
        document.getElementById(`${plugin_id_name}-next`).disabled = !(slidersTouched.size == 2)
        document.getElementById("lValue").innerText = event.target.value;
      })
 
      const startTime = performance.now();
      document.getElementById(trial_form_id).addEventListener('submit', function(event) {
        console.log("submit query...")
        event.preventDefault();
  
        // Measure response time
        var endTime = performance.now();
        var response_time = endTime - startTime;
  

        // insert data into trial data
        response.state_2_reported_transition_rating = document.getElementById('likelihood').value;
        response.state_2_certainty = document.getElementById('certainty').value;
        // document.querySelector('.landscape-sky').innerHTML = "";
        // setTimeout(function() { state_transition(); }, 800);
        // Present feedback.
        state_2_feedback(response.state_2_key, response.outcome)
        setTimeout(function() { end_trial(); }, trial.feedback_duration);
        display_element.querySelector('.alien-comp-box').remove();
      });
    }

    // function to handle responses by the subject
    var after_second_response = function(info) {

      // Kill all setTimeout handlers.
      jsPsych.pluginAPI.clearAllTimeouts();
      jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // Record responses.
      response.state_2_rt = info.rt;
      response.state_2_key = trial.valid_responses_s2.indexOf(info.key);
      response.state_2_choice = state_2_ids[response.state_2_key];
      response.outcome = trial.outcomes[response.state_2_choice];
      console.log(response)

      document.getElementById(`alien-${1 - response.state_2_key}`).setAttribute('state', 1)
      collect_alien_ratings()

    }




    // };

    // function to present second state feedback.
    var state_2_feedback = function(side, outcome) {
      // display_element.querySelector('#alien-' + side).setAttribute('status', 'chosen');
      if (outcome == 1) {
        display_element.querySelector('#diamond-' + side).setAttribute('status', 'chosen');
      } else {
        display_element.querySelector('#rock-' + side).setAttribute('status', 'chosen');
      }
    }

    // function to end trial
    var end_trial = function() {
      console.log(response)

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // kill keyboard listeners
      if (typeof keyboardListener !== 'undefined') {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      // gather the data to store for the trial

      // LMF this is where we will get our data of ratings

      var trial_data = {
        state_1_ids: state_1_ids,
        state_1_key: response.state_1_key,
        state_1_choice: response.state_1_choice,
        state_1_rt: response.state_1_rt,
        transition: trial.transition,
        state: response.state_2,
        state_2_ids: state_2_ids,
        state_2_key: response.state_2_key,
        state_2_choice: response.state_2_choice,
        state_2_rt: response.state_2_rt,
        outcome: response.outcome,
        rocket_colors: trial.rocket_colors,
        planet_colors: trial.planet_colors,
        screen_resolution: screen_resolution,
        minimum_resolution: minimum_resolution
      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // start the response listener
    var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_first_response,
      valid_responses: trial.valid_responses_s1,
      rt_method: 'performance',
      persist: false,
      allow_held_key: false
    });

    // end trial if no response.
    if (trial.choice_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        missed_response();
      }, trial.choice_duration);
    }
  };
  return plugin;
})();
