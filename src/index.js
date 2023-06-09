const { run } = require('@probot/adapter-github-actions');

run((app) => {
  app.on('pull_request.opened', async (context) => {
    const repo = context.repo();

    const pullRequest = context.payload.pull_request;

    if (
      pullRequest.state === 'closed' ||
      pullRequest.locked ||
      pullRequest.draft
    ) {
      return 'invalid event payload';
    }

    const { data } = await context.octokit.repos.compareCommits({
      owner: repo.owner,
      repo: repo.repo,
      base: pullRequest.base.sha,
      head: pullRequest.head.sha,
    });

    const { files: changedFiles, commits } = data;

    if (!changedFiles?.length) {
      return 'no change';
    }

    for (let i = 0; i < changedFiles.length; i++) {
      const file = changedFiles[i];
      const patch = file.patch || '';

      if (!patch) {
        continue;
      }

      app.log({
        repo: repo.repo,
        owner: repo.owner,
        pull_number: context.pullRequest().pull_number,
        commit_id: commits[commits.length - 1].sha,
        path: file.filename,
        body: 'hello world',
        position: patch.split('\n').length - 1,
      });

      await context.octokit.pulls.createReviewComment({
        repo: repo.repo,
        owner: repo.owner,
        pull_number: context.pullRequest().pull_number,
        commit_id: commits[commits.length - 1].sha,
        path: file.filename,
        body: 'hello world',
        position: patch.split('\n').length - 1,
      });
    }
    return;
    // return context.octokit.issues.createComment(
    //   context.issue({ body: 'Hello, World!' })
    // );
  });
});
