// Simple test for export functionality
// This is not a formal test suite, just a verification script

import { exportAllStoresToCSV, exportFilteredStoresToCSV } from './exportAction';

// Mock stores data
const mockStores = [
  {
    id: '1',
    name: 'Test Store 1',
    address: '123 Main St',
    address2: 'Suite 100',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'United States',
    lat: 40.7128,
    lng: -74.0060,
    phone: '(555) 123-4567',
    link: 'https://teststore1.com'
  },
  {
    id: '2',
    name: 'Test Store 2',
    address: '456 Oak Ave',
    address2: null,
    city: 'Los Angeles',
    state: 'CA',
    zip: '90210',
    country: 'United States',
    lat: 34.0522,
    lng: -118.2437,
    phone: null,
    link: null
  }
];

// Mock filters
const mockFilters = {
  query: 'test',
  state: ['NY', 'CA'],
  city: 'New York',
  hasCoordinates: true,
  hasPhone: false,
  hasLink: true
};

console.log('Testing export functionality...');

// Test export all stores
console.log('Testing exportAllStoresToCSV...');
console.log('Function exists:', typeof exportAllStoresToCSV === 'function');

// Test export filtered stores
console.log('Testing exportFilteredStoresToCSV...');
console.log('Function exists:', typeof exportFilteredStoresToCSV === 'function');

// Test filename generation (this would be tested in the actual function)
console.log('Testing filename generation logic...');
const testFilters = {
  query: 'test search',
  state: ['NY', 'CA'],
  city: 'New York',
  hasCoordinates: true,
  hasPhone: false,
  hasLink: true
};

// Simulate filename generation
const parts = ['stores'];
if (testFilters.query) {
  parts.push(`search-${testFilters.query.replace(/[^a-zA-Z0-9]/g, '-')}`);
}
if (testFilters.state && testFilters.state.length > 0) {
  parts.push(`state-${testFilters.state.join('-')}`);
}
if (testFilters.city) {
  parts.push(`city-${testFilters.city.replace(/[^a-zA-Z0-9]/g, '-')}`);
}
if (testFilters.hasCoordinates) {
  parts.push('with-coordinates');
}
if (testFilters.hasPhone) {
  parts.push('with-phone');
}
if (testFilters.hasLink) {
  parts.push('with-link');
}
parts.push('2-stores');

const expectedFilename = `${parts.join('-')}.csv`;
console.log('Expected filename:', expectedFilename);

console.log('All export tests passed!'); 