# ProjectDetails.jsx - Manual Updates Required

Apply these changes to complete the minimalist redesign:

## 1. Line 469 - Reduce padding
**Find:**
```jsx
<div className="p-8">
```
**Replace with:**
```jsx
<div className="p-6">
```

## 2. Line 470 - Reduce gap
**Find:**
```jsx
<div className="flex flex-col lg:flex-row gap-8">
```
**Replace with:**
```jsx
<div className="flex flex-col lg:flex-row gap-6">
```

## 3. Lines 473-478 - Add category badge and simplify title
**Find:**
```jsx
<h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
  {project.title || 'Untitled Project'}
</h1>
<p className="text-xl text-gray-600 mb-6 leading-relaxed">
  {project.shortDescription}
</p>
```
**Replace with:**
```jsx
{/* Category Badge */}
<span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium mb-3">
  {project.category || 'General'}
</span>

<h1 className="text-3xl font-bold text-gray-900 mb-3">
  {project.title || 'Untitled Project'}
</h1>
<p className="text-gray-600 mb-4 leading-relaxed">
  {project.shortDescription}
</p>
```

## 4. Lines 481-491 - Simplify creator info
**Find:**
```jsx
{/* Creator Info */}
<div className="flex items-center space-x-4 mb-6">
  <div className="w-12 h-12 bg-gradient-to-r from-color-b to-blue-600 rounded-full flex items-center justify-center">
    <span className="text-white font-bold text-lg">
      {project.createdBy?.name?.charAt(0) || 'A'}
    </span>
  </div>
  <div>
    <p className="font-semibold text-gray-800">Created by</p>
    <p className="text-gray-600">{project.createdBy?.name || 'Anonymous'}</p>
  </div>
</div>
```
**Replace with:**
```jsx
{/* Creator Info */}
<div className="flex items-center gap-3 mb-6">
  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
    <span className="text-white font-bold text-sm">
      {project.createdBy?.name?.charAt(0) || 'A'}
    </span>
  </div>
  <div>
    <p className="text-xs text-gray-500">Created by</p>
    <p className="text-sm font-medium text-gray-900">{project.createdBy?.name || 'Anonymous'}</p>
  </div>
</div>
```

## 5. Lines 495-502 - Simplify milestones section
**Find:**
```jsx
<div className="mt-8">
  <div className="flex items-center mb-4">
    <Target className="w-5 h-5 text-color-b mr-2" />
    <h3 className="text-lg font-semibold text-gray-800">Project Milestones</h3>
  </div>
  <div className="space-y-3">
    {project.milestones.map((milestone, index) => (
      <div key={milestone.id || index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
```
**Replace with:**
```jsx
<div className="mt-6">
  <div className="flex items-center gap-2 mb-4">
    <Target className="w-4 h-4 text-gray-600" />
    <h3 className="text-base font-semibold text-gray-900">Milestones</h3>
  </div>
  <div className="space-y-3">
    {project.milestones.map((milestone, index) => (
      <div key={milestone.id || index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
```

## Summary of Changes:
- ✅ Reduced padding from p-8 to p-6
- ✅ Reduced gaps from gap-8 to gap-6
- ✅ Added category badge above title
- ✅ Simplified title size (text-3xl instead of text-4xl md:text-5xl)
- ✅ Simplified description text (removed text-xl)
- ✅ Changed creator avatar to solid black (removed gradient)
- ✅ Made creator info more compact
- ✅ Simplified milestone section styling
- ✅ Changed milestone cards to gray-50 background

These changes will make the ProjectDetails page match the minimalist design system used throughout the app.
