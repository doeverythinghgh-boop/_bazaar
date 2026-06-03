/**
 * @file orderStage/orderData/parts/admin-partials/workflow-guide-main.js
 * @description Composes admin workflow guide sections.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.OrderData_Admin_WorkflowGuide = {
    render: function (statusObj) {
        const workflowTable = window.OrderData_Admin_WorkflowGuideTable?.render(statusObj) || '';
        const comparison = window.OrderData_Admin_WorkflowComparison?.render() || '';
        return workflowTable + comparison;
    }
};
