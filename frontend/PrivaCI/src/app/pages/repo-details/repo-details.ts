import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-repo-details',
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './repo-details.html',
  styleUrl: './repo-details.css',
})
export class RepoDetails {
  private route = inject(ActivatedRoute);

  repoId: string = '';
  
  // Mock repository metadata
  repoStatus = 'Critical';
  commitHash = 'f9e8d7c';
  lastScanned = new Date();
  
  // Mock forensic findings
  findings = [
    {
      type: 'KEY',
      file: 'src/config/aws-config.ts',
      line: 14,
      severity: 'Critical',
      description: 'Exposed AWS Secret Access Key detected.',
      snippet: '13 | export const config = {\n14 |   secretAccessKey: "AKIAIOSFODNN7EXAMPLE",\n15 |   region: "us-east-1"\n16 | };'
    },
    {
      type: 'PII',
      file: 'src/controllers/user.controller.ts',
      line: 42,
      severity: 'Warning',
      description: 'Potential logging of plain-text email address.',
      snippet: '41 | const user = await db.find({ id: req.body.id });\n42 | console.log("Login attempt for email: ", user.email);\n43 | return res.status(200);'
    }
  ];

  ngOnInit() {
    // Extract the ID from the URL (e.g., 'backend-api')
    this.repoId = this.route.snapshot.paramMap.get('id') || 'unknown-repo';
  }
}
