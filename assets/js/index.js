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
      
      let homework = $(res).find('.m-homeworkitem');
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
    
      let complete = statuses['Complete and satisfactory'].length + statuses['Exceeds expectations'].length;
      
      let incomplete = statuses['Not Submitted'].length + statuses['Incomplete'].length + statuses['Complete and unsatisfactory'].length;
      
      let completeAssignments = statuses['Complete and satisfactory'].concat(statuses['Exceeds expectations']);
            
      let studentPoints = 0;
      completeAssignments.forEach( assignment => {
        if (assignment.title.match(/\*\*/)) {
          studentPoints = studentPoints + 4;
        } else {
          studentPoints = studentPoints + 1;
        }
      });
      
      let grade = Math.floor((studentPoints / totalPoints) * 100);
      
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
    $('section.l-content').prepend(displayHTML);
  }
  
  function displayTemplate () {
    return `
      <div class="mx-auto max-width-2 px2">
        <div class="clearfix mxn2 mt2 sm-mt4">
          <div class="col col-12 px2">
            <div class="box-stacked block">
              <div class="m-immersiveitem px2 py3 sm-p3">
                <div class="m-immersiveitem-info">
                  <h3 class="m-immersiveitem-info-title">Current Standing</h3>
                </div>
                <div class="m-immersiveitem-meta" id="myGrade">calculating...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  function gradeTemplate (color, myGrade) {
    return `
      <label class="m-immersiveitem-meta-type" style="background-color: ${ color }; color: #FFF;">
        ${ myGrade }% Complete
      </label>
    `;
  }
  
  
  chrome.storage.sync.get(['path', 'unit'], function(items) {
    init(items);
  });
  
}());
