;(function () {
  
  'use strict';
  
  
  function init (items) {
    
    if (!items.path) return alert('Sorry, you need to set a path first in the extension options.');
    if (!items.unit) return alert('Sorry, you need to set a assignment path first.');
    
    preloadTemplate();
    
    let baseURL   = 'https://online.theironyard.com';
    let pathURL   = baseURL + '/paths/' + items.path;
    let hwURL     = baseURL + '/homework/path/' + items.path;
    let asgnUnit  = items.unit;
    
    $.get(pathURL).then( res => {
      
      let hwUnit = $(res).find("[data-pathitem='" + asgnUnit + "']");
      let assignments = hwUnit.find('.m-pathitem-resources a');

      let totalAssignments = [];
      assignments.each( (index, item) => {
        totalAssignments.push(
          $.trim($(item).find('h4.m-unititem-title').text())
        );
      });
            
      let totalPoints = calculateTotalPoints(totalAssignments);
      
      checkStudentAssignments(hwURL, totalPoints);
      
    });

  }
  
  function calculateTotalPoints(assignments) {
    let totalPoints = 0;
    assignments.forEach( assignment => {
      if (assignment.match(/\*\*/)) {
        totalPoints = totalPoints + 4;
      } else {
        totalPoints = totalPoints + 1;
      }
    });
    return totalPoints;
  }
  
   
  function checkStudentAssignments (hwURL, totalPoints) {
    
    $.get(hwURL).then( res => {
      
      // Get homework & filter out any bonus assignment
      let initialHomework = $(res).find('.m-homeworkitem');
      let homework = initialHomework.filter( (index, element) => {
        return $(element).find('.m-homeworkitem-title a').text().indexOf('Bonus') < 0;
      });

      let statuses = {
        'Not graded': [], 'Incomplete': [], 'Complete and unsatisfactory': [], 
        'Complete and satisfactory': [], 'Exceeds expectations': [], 'Retracted': [], 
        'Not Submitted': []
      };
          
      homework.each( (index, row) => {
        
        let statusElem  = $(row).find('table tbody tr').eq(0).find('td').eq(1);
        let status      = $.trim(statusElem.find('span').text());
        let assignment  = {
          id: statusElem.find('a').attr('href'),
          title: $.trim($(row).find('.m-homeworkitem-title a').text())
        }
        
        statuses[status].push(assignment);

      });
      
      calculateGrade(statuses, totalPoints);
    
    });
  }
  
  function calculateGrade (statuses, totalPoints) {
      
      let incomplete = statuses['Not Submitted'].length + statuses['Incomplete'].length + statuses['Complete and unsatisfactory'].length;
      
      let complete = statuses['Complete and satisfactory'].concat(statuses['Exceeds expectations']);
            
      let studentPoints = 0;
      complete.forEach( assignment => {
        if (assignment.title.match(/\*\*/)) {
          studentPoints = studentPoints + 4;
        } else {
          studentPoints = studentPoints + 1;
        }
      });
      
      let grade = Math.floor((studentPoints / totalPoints) * 100);

      // console.log('Student Points', studentPoints);
      // console.log('Total Points', totalPoints);
      // console.log('Grade', grade);
      // console.log(statuses);
      
      displayOnScreen(grade);
    
  }
  
  function displayOnScreen(grade) {
    let color = function () {
      if (grade > 80) return '#6fbbb7';
      if (grade > 70) return '#f0ad4e';
      if (grade < 70) return '#e74c3c';
    }
    
    let gradeHTML = gradeTemplate(color(), grade);
    $('#myGrade').html(gradeHTML);
  }
  
  
  function preloadTemplate() {
    let displayHTML = displayTemplate();
    $('h5.mb2').first().after(displayHTML);
  }
  
  function displayTemplate () {
    return `
      <div class="box-stacked bg-light-grey py2 px3">
        <div class="mb1">
          <span class="font-large font-sans-medium color-grey mr1" id="myGrade">
            <span class="loading-pulse"></span>
          </span>
          <span class="font-small">Course Grade</span>
        </div>
      </div>
    `;
  }
  
  function gradeTemplate (color, myGrade) {
    return `
      <span class="cool-grade" style="background-color: ${ color };">${ myGrade }%</span>
    `;
  }
  
  
  chrome.storage.sync.get(['path', 'unit'], function(items) {
    init(items);
  });
  
}());
