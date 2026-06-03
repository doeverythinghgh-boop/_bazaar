/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function(window){
  "use strict";

  window.kidsData = {
    category: 'kids',
    title: 'cs_table_kids_title',
    note: 'cs_kids_subtitle',
    columns: ['cs_label_age', 'cs_label_length_cm', 'cs_label_chest_cm', 'cs_label_approx_weight_kg'],
    rows: [
      ['cs_age_0_3_months', '56-62', '40-43', '4-6'],
      ['cs_age_3_6_months', '62-68', '43-46', '6-8'],
      ['cs_age_6_9_months', '68-74', '46-48', '8-9'],
      ['cs_age_9_12_months', '74-80', '48-50', '9-10'],
      ['cs_age_12_18_months', '80-86', '50-52', '10-12'],
      ['cs_age_18_24_months', '86-92', '52-54', '12-14'],
      ['cs_age_2_3_years', '92-98', '54-56', '14-16'],
      ['cs_age_3_4_years', '98-104', '56-58', '16-18'],
      ['cs_age_5_6_years', '110-116', '60-62', '20-23'],
      ['cs_age_7_8_years', '122-128', '64-68', '25-28'],
      ['cs_age_9_10_years', '134-140', '70-74', '30-34'],
      ['cs_age_11_12_years', '146-152', '76-80', '36-42']
    ],
    svgValues: { height: 86, chest: 50 }
  };
})(window);
