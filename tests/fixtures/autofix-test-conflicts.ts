// Test file for conflict resolution
import{unused,used}from"module"
const x=used
function unused() { } // Conflict: same name as import
const y:"string"=123 // Type and format issue on same line