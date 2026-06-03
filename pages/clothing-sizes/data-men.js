/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
(function(window){
  "use strict";

  window.menData = {
    category: 'men',
    title: 'cs_men_clothing',
    subTypes: {
      tshirt: {
        name: 'cs_item_tshirt',
        columns: ['cs_label_size', 'cs_label_chest_cm', 'cs_label_length_cm'],
        rows: [
          ['M', '96 - 104', '68 - 74'],
          ['L', '104 - 112', '72 - 76'],
          ['XL', '112 - 120', '74 - 78'],
          ['2XL', '120 - 128', '76 - 80'],
          ['3XL', '128 - 136', '78 - 82'],
          ['4XL', '136 - 144', '80 - 84'],
          ['5XL', '144 - 152', '82 - 86']
        ]
      },
      shirt: {
        name: 'cs_item_shirt',
        columns: ['cs_label_size', 'cs_label_chest_cm', 'cs_label_length_cm'],
        rows: [
          ['38 / S', '100 - 104', '72 - 76'],
          ['40 / M', '106 - 110', '74 - 78'],
          ['42 / L', '112 - 116', '76 - 80'],
          ['44 / XL', '118 - 122', '78 - 82'],
          ['46 / 2XL', '124 - 128', '80 - 84'],
          ['48 / 3XL', '130 - 134', '82 - 86']
        ]
      },
      pants: {
        name: 'cs_item_pants',
        columns: ['cs_label_size', 'cs_label_waist_cm', 'cs_label_length_cm'],
        rows: [
          ['30', '78 - 82', '100 - 102'],
          ['32', '82 - 86', '102 - 104'],
          ['34', '86 - 90', '104 - 106'],
          ['36', '90 - 94', '106 - 108'],
          ['38', '94 - 98', '108 - 110'],
          ['40', '98 - 102', '110 - 112']
        ]
      }
    }
  };
})(window);
